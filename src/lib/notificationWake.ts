import type { Telegraf } from 'telegraf';
import { getBot } from '../bot.js';
import {
  checkAndSendNotifications,
  checkAndSendNotificationsForUser,
} from '../services/notificationService.js';

let lastWakeAtMs = 0;
const WAKE_DEBOUNCE_MS = 45_000;

/**
 * Запускает проверку уведомлений после пробуждения инстанса (health / keepalive).
 * Не чаще одного раза в ~45 с, чтобы не дублировать минутный cron.
 */
export function maybeWakeNotificationCheck(source: string): void {
  const bot = getBot();
  if (!bot) {
    return;
  }

  const nowMs = Date.now();
  if (nowMs - lastWakeAtMs < WAKE_DEBOUNCE_MS) {
    return;
  }
  lastWakeAtMs = nowMs;

  void checkAndSendNotifications(bot).catch((error) => {
    console.error(`Notification wake check failed (${source}):`, error);
  });
}

export async function runNotificationCheckForUser(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  await checkAndSendNotificationsForUser(bot, telegramChatId, now);
}
