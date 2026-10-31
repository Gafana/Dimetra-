import { Markup, type Context, type Telegraf, type Telegram } from 'telegraf';
import {
  commandArgs,
  formatPromoExpiry,
  isExactPromoCode,
  isPromoAdmin,
  listPromoAdminIds,
  messageCarriesPromoCode,
  parsePromoCommand,
  PROMO_COMMAND_HELP,
  resolvePromoTimeZone,
  hasStartPayload,
} from './lib/promoCode.js';
import { resolveTelegramWebAppUrl } from './lib/webAppUrl.js';
import { ensureSettingsForChat } from './services/settingsService.js';
import {
  createPromoCode,
  deleteUnusedPromoCode,
  getUserAccess,
  isAdmitted,
  PromoConfigError,
  redeemPromoCode,
  type IssuedPromoCode,
} from './services/promoService.js';

const ADMITTED_INTRO =
  'Привет! Я помогу следить за уходом за твоими растениями. Открой приложение, чтобы добавить комнаты и растения.';

const PROMO_PROMPT = [
  'Привет! Dimetra открывается по промокоду.',
  '',
  'Отправьте код одним сообщением в этот чат. Бот сразу удалит сообщение с кодом.',
  'Не вставляйте код в ссылку и не добавляйте к нему другой текст.',
  '',
  'Повторный вход будет без кода — только по вашему Telegram.',
].join('\n');

const PROMO_ACCEPTED =
  'Промокод принят. Можно открывать Dimetra — в следующий раз код не понадобится.';

interface PendingInvite {
  chatId: number;
  messageId: number;
  codeHash: string;
}

const pendingInvites = new Map<string, PendingInvite[]>();

function telegramErrorCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = (error as { response?: { error_code?: number } }).response;
  return response?.error_code;
}

function messageText(ctx: Context): string {
  const message = ctx.message;
  if (message && 'text' in message) {
    return message.text;
  }
  return '';
}

function privateTelegramUserId(ctx: Context): string | null {
  if (ctx.chat?.type !== 'private' || !ctx.from) {
    return null;
  }
  if (ctx.chat.id !== ctx.from.id) {
    return null;
  }
  return String(ctx.from.id);
}

function rememberPendingInvite(telegramId: string, invite: PendingInvite): void {
  const current = pendingInvites.get(telegramId) ?? [];
  current.push(invite);
  pendingInvites.set(telegramId, current);
}

async function scrubPendingInvites(
  telegram: Telegram,
  telegramId: string,
  redeemedHash: string | null,
): Promise<void> {
  const pending = pendingInvites.get(telegramId);
  if (!pending?.length) {
    return;
  }
  pendingInvites.delete(telegramId);

  for (const invite of pending) {
    if (invite.codeHash !== redeemedHash) {
      try {
        await deleteUnusedPromoCode(invite.codeHash);
      } catch (error) {
        console.error(
          `Failed to revoke unused invite for ${telegramId}:`,
          error instanceof Error ? error.message : 'unknown',
        );
      }
    }

    try {
      await telegram.editMessageText(
        invite.chatId,
        invite.messageId,
        undefined,
        'Код в этом сообщении больше не показан. Если доступ уже открыт, нажмите /start.',
      );
    } catch (error) {
      console.error(
        `Failed to clear invite message for ${telegramId}:`,
        telegramErrorCode(error) ?? 'unknown',
      );
    }
  }
}

async function deleteUserMessage(ctx: Context): Promise<void> {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error(
      `Failed to delete promo message for ${ctx.from?.id ?? 'unknown'}:`,
      telegramErrorCode(error) ?? 'unknown',
    );
  }
}

async function syncMiniAppMenu(telegram: Telegram, chatId: number, allowed: boolean): Promise<void> {
  const url = allowed ? resolveTelegramWebAppUrl() : null;
  try {
    if (url) {
      await telegram.setChatMenuButton({
        chatId,
        menuButton: {
          type: 'web_app',
          text: 'Dimetra',
          web_app: { url },
        },
      });
      return;
    }
    await telegram.setChatMenuButton({
      chatId,
      menuButton: { type: 'commands' },
    });
  } catch (error) {
    console.error(
      `Failed to set chat menu button for ${chatId}:`,
      telegramErrorCode(error) ?? 'unknown',
    );
  }
}

async function replyWithApp(ctx: Context, text: string): Promise<void> {
  const url = resolveTelegramWebAppUrl();
  if (!url) {
    await ctx.reply(`${text}\n\nКнопка Mini App появится после настройки WEB_APP_URL на HTTPS.`);
    return;
  }
  await ctx.reply(text, Markup.inlineKeyboard([Markup.button.webApp('🌿 Открыть Dimetra', url)]));
}

async function openForAdmittedUser(ctx: Context, userId: string, text: string): Promise<void> {
  await ensureSettingsForChat(userId);
  if (ctx.chat) {
    await syncMiniAppMenu(ctx.telegram, ctx.chat.id, true);
  }
  await replyWithApp(ctx, text);
}

function adminCodeMessage(issued: IssuedPromoCode): string {
  const until = formatPromoExpiry(issued.expiresAt, resolvePromoTimeZone());
  return [
    'Промокод создан. Сообщение защищено от пересылки.',
    '',
    issued.plain,
    '',
    `Лимит активаций: ${issued.maxActivations}`,
    `Действует до: ${until}`,
    'В базе сохранён только хеш. Не отправляйте код ссылкой.',
  ].join('\n');
}

function friendCodeMessage(plain: string, expiresAt: Date): string {
  const until = formatPromoExpiry(expiresAt, resolvePromoTimeZone());
  return [
    'Одноразовый промокод для входа в Dimetra.',
    '',
    plain,
    '',
    `Действует до: ${until}`,
    'Отправьте код сюда отдельным сообщением. Бот удалит сообщение с кодом.',
    'Не вставляйте код в ссылку.',
  ].join('\n');
}

async function handleInvite(
  ctx: Context,
  telegramIds: string[],
  expiresAt: Date,
): Promise<void> {
  const lines: string[] = [];

  for (const telegramId of telegramIds) {
    const access = await getUserAccess(telegramId);
    if (access.hasGardenData) {
      lines.push(`${telegramId}: уже есть комнаты или растения, код не отправлен.`);
      continue;
    }
    if (access.admitted) {
      lines.push(`${telegramId}: пользователь уже есть в базе, код не отправлен.`);
      continue;
    }

    let issued: IssuedPromoCode | null = null;
    try {
      issued = await createPromoCode({ maxActivations: 1, expiresAt });
      const sent = await ctx.telegram.sendMessage(
        Number(telegramId),
        friendCodeMessage(issued.plain, expiresAt),
        { protect_content: true },
      );
      rememberPendingInvite(telegramId, {
        chatId: Number(telegramId),
        messageId: sent.message_id,
        codeHash: issued.codeHash,
      });
      lines.push(`${telegramId}: одноразовый код отправлен в личку.`);
    } catch (error) {
      if (issued) {
        try {
          await deleteUnusedPromoCode(issued.codeHash);
        } catch (deleteError) {
          console.error(
            `Failed to roll back unsent promo code for ${telegramId}:`,
            deleteError instanceof Error ? deleteError.message : 'unknown',
          );
        }
      }
      if (error instanceof PromoConfigError) {
        lines.push('Сервер не настроен: задайте PROMO_CODE_PEPPER (не короче 16 символов).');
        break;
      }
      const code = telegramErrorCode(error);
      if (code === 403 || code === 400) {
        lines.push(
          `${telegramId}: бот не смог написать в личку. Пусть пользователь сначала откроет бота и нажмёт /start.`,
        );
      } else {
        console.error(`Failed to send invite to ${telegramId}:`, code ?? 'unknown');
        lines.push(`${telegramId}: не удалось отправить код.`);
      }
    }
  }

  await ctx.reply(lines.join('\n'));
}

export function registerBotHandlers(bot: Telegraf): void {
  bot.start(async (ctx) => {
    if (hasStartPayload(messageText(ctx))) {
      await deleteUserMessage(ctx);
    }

    const userId = privateTelegramUserId(ctx);
    if (!userId || !ctx.chat) {
      await ctx.reply('Напишите боту в личные сообщения — промокод принимается только там.');
      return;
    }

    if (await isAdmitted(userId)) {
      await openForAdmittedUser(ctx, userId, ADMITTED_INTRO);
      return;
    }

    await syncMiniAppMenu(ctx.telegram, ctx.chat.id, false);
    await ctx.reply(PROMO_PROMPT);
  });

  bot.command('promo', async (ctx) => {
    const userId = privateTelegramUserId(ctx);
    if (!userId) {
      await ctx.reply('Команду /promo можно использовать только в личном чате с ботом.');
      return;
    }
    if (!isPromoAdmin(userId)) {
      await ctx.reply('Команда недоступна.');
      return;
    }

    const parsed = parsePromoCommand(commandArgs(messageText(ctx)));
    if (!parsed.ok) {
      await ctx.reply(`${parsed.message}\n\nПодсказка: /promo help`);
      return;
    }
    if (parsed.action === 'help') {
      await ctx.reply(PROMO_COMMAND_HELP);
      return;
    }
    if (parsed.action === 'invite') {
      await handleInvite(ctx, parsed.telegramIds, parsed.expiresAt);
      return;
    }

    try {
      const issued = await createPromoCode({
        maxActivations: parsed.maxActivations,
        expiresAt: parsed.expiresAt,
      });
      try {
        await ctx.reply(adminCodeMessage(issued), { protect_content: true });
      } catch (error) {
        await deleteUnusedPromoCode(issued.codeHash);
        console.error(
          `Failed to deliver generated promo code to admin ${userId}:`,
          telegramErrorCode(error) ?? 'unknown',
        );
        await ctx.reply('Не удалось отправить код. Он не сохранён. Попробуйте ещё раз.');
      }
    } catch (error) {
      if (error instanceof PromoConfigError) {
        await ctx.reply('Задайте PROMO_CODE_PEPPER на сервере (не короче 16 символов).');
        return;
      }
      console.error(
        'Failed to create promo code:',
        error instanceof Error ? error.message : 'unknown',
      );
      await ctx.reply('Не удалось создать промокод. Попробуйте ещё раз.');
    }
  });

  bot.on('message', async (ctx, next) => {
    const message = ctx.message;
    if (!message || 'text' in message) {
      return next();
    }
    const userId = privateTelegramUserId(ctx);
    if (!userId) {
      return;
    }
    if (await isAdmitted(userId)) {
      return;
    }
    await ctx.reply('Нужен промокод текстом, одним сообщением.');
  });

  bot.on('text', async (ctx) => {
    const userId = privateTelegramUserId(ctx);
    if (!userId) {
      return;
    }

    const text = messageText(ctx);
    if (text.startsWith('/')) {
      if (!(await isAdmitted(userId))) {
        await ctx.reply('Сначала отправьте промокод обычным сообщением. /start повторит подсказку.');
      }
      return;
    }

    const carriesCode = messageCarriesPromoCode(text);
    if (carriesCode) {
      await deleteUserMessage(ctx);
    }

    if (await isAdmitted(userId)) {
      if (carriesCode) {
        await scrubPendingInvites(ctx.telegram, userId, null);
        await openForAdmittedUser(ctx, userId, 'Доступ уже открыт, новый код не нужен.');
      }
      return;
    }

    if (!carriesCode) {
      await ctx.reply('Пришлите промокод одним сообщением, без другого текста.');
      return;
    }
    if (!isExactPromoCode(text)) {
      await ctx.reply('Пришлите только промокод, без другого текста. Сообщение с кодом удалено.');
      return;
    }

    const result = await redeemPromoCode(userId, text);
    if (!result.ok) {
      const reply =
        result.reason === 'config'
          ? 'Сейчас не получается проверить промокод. Попробуйте чуть позже.'
          : result.reason === 'error'
            ? 'Не удалось проверить промокод. Отправьте его ещё раз одним сообщением.'
            : 'Промокод не принят. Он не найден, уже просрочен или исчерпал лимит активаций.';
      await ctx.reply(reply);
      return;
    }

    await scrubPendingInvites(ctx.telegram, userId, result.codeHash);
    await openForAdmittedUser(ctx, userId, PROMO_ACCEPTED);
  });
}

export async function configureBotCommands(bot: Telegraf): Promise<void> {
  await bot.telegram.setMyCommands([{ command: 'start', description: 'Открыть Dimetra' }]);

  const adminCommands = [
    { command: 'start', description: 'Открыть Dimetra' },
    { command: 'promo', description: 'Создать промокод' },
  ];

  for (const adminId of listPromoAdminIds()) {
    try {
      await bot.telegram.setMyCommands(adminCommands, {
        scope: { type: 'chat', chat_id: Number(adminId) },
      });
    } catch (error) {
      console.error(
        `Failed to set admin commands for ${adminId}:`,
        telegramErrorCode(error) ?? 'unknown',
      );
    }
  }
}
