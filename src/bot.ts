import { Telegraf, Markup } from 'telegraf';
import { ensureSettingsForChat } from './services/settingsService.js';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:5173';

let botInstance: Telegraf | null = null;

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

      await ctx.reply(
        'Привет! Я помогу следить за уходом за твоими растениями. Открой приложение, чтобы добавить комнаты и растения.',
        Markup.inlineKeyboard([
          Markup.button.webApp('🌿 Открыть Dimetra', WEB_APP_URL),
        ]),
      );
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
