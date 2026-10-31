import cron, { type ScheduledTask } from 'node-cron';
import type { Telegraf } from 'telegraf';
import { checkAndSendNotifications } from '../services/notificationService.js';

let notificationCronTask: ScheduledTask | null = null;

/**
 * Каждую минуту проверяет пользователей и отправляет напоминания.
 * Время сравнивается в часовом поясе каждого пользователя (user_settings.timezone).
 */
export function startNotificationScheduler(bot: Telegraf): ScheduledTask {
  stopNotificationScheduler();

  notificationCronTask = cron.schedule('* * * * *', () => {
    try {
      void checkAndSendNotifications(bot).catch((error) => {
        console.error('Notification cron job failed:', error);
      });
    } catch (error) {
      console.error('Notification cron tick error:', error);
    }
  });

  console.log('Notification scheduler started (every minute)');
  return notificationCronTask;
}

export function stopNotificationScheduler(): void {
  if (notificationCronTask) {
    notificationCronTask.stop();
    notificationCronTask = null;
    console.log('Notification scheduler stopped');
  }
}
