import { Telegraf, Markup } from 'telegraf';
import { ensureSettingsForChat } from './services/settingsService.js';

let botInstance: Telegraf | null = null;

/** Telegram Web App buttons require HTTPS. Local http:// URLs break /start on production. */
function resolveTelegramWebAppUrl(): string | null {
  const raw = process.env.WEB_APP_URL?.trim();
  if (!raw) {
    return null;
  }
  if (raw.startsWith('https://')) {
    return raw;
  }
  console.warn(
    `WEB_APP_URL must start with https:// for Telegram Mini App (current: "${raw}"). Web App button omitted.`,
  );
  return null;
}

export function createBot(): Telegraf {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN environment variable is required');
  }

  const bot = new Telegraf(token);

  bot.catch((error, ctx) => {
    console.error('Telegram bot handler error:', error);
    if (ctx.chat?.id) {
      void ctx.reply('Не удалось обработать команду. Попробуйте ещё раз через несколько секунд.').catch(
        (replyError) => {
          console.error('Failed to send error reply:', replyError);
        },
      );
    }
  });

  bot.start(async (ctx) => {
    try {
      const chatId = String(ctx.chat.id);
      await ensureSettingsForChat(chatId);

      const intro =
        'Привет! Я помогу следить за уходом за твоими растениями. Открой приложение, чтобы добавить комнаты и растения.';
      const webAppUrl = resolveTelegramWebAppUrl();

      if (webAppUrl) {
        await ctx.reply(
          intro,
          Markup.inlineKeyboard([
            Markup.button.webApp('🌿 Открыть Dimetra', webAppUrl),
          ]),
        );
      } else {
        await ctx.reply(
          `${intro}\n\n_(Кнопка Mini App появится после деплоя фронтенда и настройки WEB_APP_URL на HTTPS.)_`,
          { parse_mode: 'Markdown' },
        );
      }
    } catch (error) {
      console.error('Failed to handle /start:', error);
      throw error;
    }
  });

  botInstance = bot;
  return bot;
}

/** Экземпляр бота после успешного `createBot()` (для cron и сервисов). */
export function getBot(): Telegraf | null {
  return botInstance;
}

export function clearBotInstance(): void {
  botInstance = null;
}
