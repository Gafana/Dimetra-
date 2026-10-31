import { Telegraf } from 'telegraf';
import { configureBotCommands, registerBotHandlers } from './promoBot.js';

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

  registerBotHandlers(bot);

  void configureBotCommands(bot).catch((error) => {
    console.error('Failed to configure bot commands:', error);
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
