import type { Telegraf } from 'telegraf';
import { todayIsoDate } from '../lib/dates.js';
import { notificationTimeMatchesNow } from '../lib/time.js';
import { query } from '../db/pool.js';

interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
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

async function findUsersForCurrentMinute(now = new Date()): Promise<UserSettingsRow[]> {
  const settings = await query<UserSettingsRow>(
    `SELECT id, telegram_chat_id, notification_time
     FROM user_settings`,
  );

  return settings.filter((row) => notificationTimeMatchesNow(row.notification_time, now));
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

async function sendNotificationToUser(
  bot: Telegraf,
  telegramChatId: string,
  text: string,
): Promise<void> {
  await bot.telegram.sendMessage(telegramChatId, text, { parse_mode: 'HTML' });
}

export async function checkAndSendNotifications(bot: Telegraf, now = new Date()): Promise<void> {
  const today = todayIsoDate();
  const users = await findUsersForCurrentMinute(now);

  for (const user of users) {
    try {
      const plants = await findDuePlantsForUser(user.telegram_chat_id, today);
      const message = buildNotificationMessage(plants, today);
      if (!message) {
        continue;
      }

      await sendNotificationToUser(bot, user.telegram_chat_id, message);
    } catch (error) {
      console.error(
        `Failed to send care notification to chat ${user.telegram_chat_id}:`,
        error,
      );
    }
  }
}
