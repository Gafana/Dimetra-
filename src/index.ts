import './loadEnv.js';
import type { Telegraf } from 'telegraf';
import { clearBotInstance, createBot } from './bot.js';
import { closeDb, initDb } from './db/initDb.js';
import { startNotificationScheduler, stopNotificationScheduler } from './lib/scheduler.js';
import { createApp } from './server.js';

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  await initDb();

  const app = createApp();
  let bot: Telegraf | null = null;

  const server = app.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });

  if (process.env.BOT_TOKEN) {
    bot = createBot();
    void bot
      .launch(() => {
        console.log('Telegram bot started (long polling)');
        startNotificationScheduler(bot!);
      })
      .catch((error) => {
        console.error('Failed to start Telegram bot:', error);
      });
  } else {
    console.warn('BOT_TOKEN is not set — HTTP API only (Telegram bot disabled)');
  }

  async function shutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}, shutting down...`);

    stopNotificationScheduler();

    bot?.stop(signal);
    clearBotInstance();
    bot = null;

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    await closeDb();
    process.exit(0);
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
