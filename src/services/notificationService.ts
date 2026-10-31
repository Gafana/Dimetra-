import type { Telegraf } from 'telegraf';
import { execute, query } from '../db/pool.js';
import { isNotificationDue, todayIsoDateInTimeZone } from '../lib/time.js';

interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
  timezone: string;
  last_notified_date: string | null;
}

interface PlantDueRow {
  custom_name: string;
  next_watering_date: string | null;
  next_feeding_date: string | null;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildCareLines(plant: PlantDueRow, today: string): string[] {
  const lines: string[] = [];
  const wateringDue =
    plant.next_watering_date !== null && plant.next_watering_date <= today;
  const feedingDue =
    plant.next_feeding_date !== null && plant.next_feeding_date <= today;

  if (!wateringDue && !feedingDue) {
    return lines;
  }

  const name = escapeHtml(plant.custom_name);
  if (wateringDue && feedingDue) {
    lines.push(`• ${name}: нужны полив и подкормка`);
  } else if (wateringDue) {
    lines.push(`• ${name}: нужен полив`);
  } else {
    lines.push(`• ${name}: нужна подкормка`);
  }

  return lines;
}

async function loadAllUserSettings(): Promise<UserSettingsRow[]> {
  return query<UserSettingsRow>(
    `SELECT id, telegram_chat_id, notification_time, timezone, last_notified_date
     FROM user_settings`,
  );
}

async function findDuePlantsForUser(
  telegramChatId: string,
  today: string,
): Promise<PlantDueRow[]> {
  return query<PlantDueRow>(
    `SELECT custom_name, next_watering_date, next_feeding_date
     FROM user_plants
     WHERE telegram_chat_id = $1
       AND (
         (next_watering_date IS NOT NULL AND next_watering_date <= $2)
         OR (next_feeding_date IS NOT NULL AND next_feeding_date <= $3)
       )
     ORDER BY LOWER(custom_name)`,
    [telegramChatId, today, today],
  );
}

function buildNotificationMessage(plants: PlantDueRow[], today: string): string | null {
  const bodyLines = plants.flatMap((plant) => buildCareLines(plant, today));
  if (bodyLines.length === 0) {
    return null;
  }

  return ['🪴 <b>Время позаботиться о растениях!</b>', ...bodyLines].join('\n');
}

async function markUserNotifiedToday(settingsId: string, dateIso: string): Promise<void> {
  await execute(`UPDATE user_settings SET last_notified_date = $1 WHERE id = $2`, [
    dateIso,
    settingsId,
  ]);
}

async function sendNotificationToUser(
  bot: Telegraf,
  telegramChatId: string,
  text: string,
): Promise<void> {
  await bot.telegram.sendMessage(telegramChatId, text, { parse_mode: 'HTML' });
}

async function deliverDailyNotification(
  bot: Telegraf,
  user: UserSettingsRow,
  now: Date,
  options?: { testPrefix?: boolean },
): Promise<'sent' | 'empty'> {
  const today = todayIsoDateInTimeZone(user.timezone, now);
  const plants = await findDuePlantsForUser(user.telegram_chat_id, today);
  const message = buildNotificationMessage(plants, today);

  if (!message) {
    if (options?.testPrefix) {
      await sendNotificationToUser(
        bot,
        user.telegram_chat_id,
        '🧪 <b>Тест уведомления</b>\n\nСегодня нет растений, которым нужны полив или подкормка.',
      );
      return 'empty';
    }
    return 'empty';
  }

  const text = options?.testPrefix ? `🧪 <b>Тест уведомления</b>\n\n${message}` : message;
  await sendNotificationToUser(bot, user.telegram_chat_id, text);
  if (!options?.testPrefix) {
    await markUserNotifiedToday(user.id, today);
  }
  return 'sent';
}

export async function checkAndSendNotifications(bot: Telegraf, now = new Date()): Promise<void> {
  const users = await loadAllUserSettings();

  for (const user of users) {
    if (
      !isNotificationDue(
        user.notification_time,
        user.timezone,
        user.last_notified_date,
        now,
      )
    ) {
      continue;
    }

    try {
      await deliverDailyNotification(bot, user, now);
    } catch (error) {
      console.error(
        `Failed to send care notification to chat ${user.telegram_chat_id}:`,
        error,
      );
    }
  }
}

/** Немедленная отправка уведомления админу (не меняет last_notified_date при пустом списке). */
export async function sendTestCareNotification(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  const users = await loadAllUserSettings();
  const user = users.find((row) => row.telegram_chat_id === telegramChatId);
  if (!user) {
    throw new Error('user_settings not found for chat');
  }

  const result = await deliverDailyNotification(bot, user, now, { testPrefix: true });
  if (result === 'sent' || result === 'empty') {
    return;
  }
}
