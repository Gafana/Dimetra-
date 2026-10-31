import type { Telegraf } from 'telegraf';
import type { InlineKeyboardMarkup } from 'telegraf/types';
import { execute, query } from '../db/pool.js';
import { isNotificationDue, todayIsoDateInTimeZone } from '../lib/time.js';
import {
  buildDailyOverdueNotificationMessage,
  buildDailyTodayNotificationMessage,
  buildOverdueMessage,
  buildTodayPlanMessage,
  type TodayPlanItem,
} from './careBotMessages.js';
import {
  listOpenObligationsForUser,
  syncCareObligationsForUser,
} from './careObligationService.js';

interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
  timezone: string;
  last_notified_date: string | null;
  last_overdue_notified_date: string | null;
}

interface PlantScheduleRow {
  id: string;
  custom_name: string;
  next_watering_date: string | null;
  next_feeding_date: string | null;
}

async function loadAllUserSettings(): Promise<UserSettingsRow[]> {
  return query<UserSettingsRow>(
    `SELECT id, telegram_chat_id, notification_time, timezone,
            last_notified_date, last_overdue_notified_date
     FROM user_settings`,
  );
}

async function loadUserSettings(telegramChatId: string): Promise<UserSettingsRow | undefined> {
  const rows = await query<UserSettingsRow>(
    `SELECT id, telegram_chat_id, notification_time, timezone,
            last_notified_date, last_overdue_notified_date
     FROM user_settings
     WHERE telegram_chat_id = $1`,
    [telegramChatId],
  );
  return rows[0];
}

async function findTodayPlanItems(
  telegramChatId: string,
  today: string,
): Promise<TodayPlanItem[]> {
  const plants = await query<PlantScheduleRow>(
    `SELECT id, custom_name, next_watering_date, next_feeding_date
     FROM user_plants
     WHERE telegram_chat_id = $1`,
    [telegramChatId],
  );

  const items: TodayPlanItem[] = [];
  for (const plant of plants) {
    if (plant.next_watering_date === today) {
      items.push({
        plant_id: plant.id,
        custom_name: plant.custom_name,
        action_type: 'watering',
      });
    }
    if (plant.next_feeding_date === today) {
      items.push({
        plant_id: plant.id,
        custom_name: plant.custom_name,
        action_type: 'feeding',
      });
    }
  }

  items.sort((a, b) => a.custom_name.localeCompare(b.custom_name, 'ru'));
  return items;
}

async function markUserNotifiedToday(settingsId: string, dateIso: string): Promise<void> {
  await execute(`UPDATE user_settings SET last_notified_date = $1 WHERE id = $2`, [
    dateIso,
    settingsId,
  ]);
}

async function markUserOverdueNotifiedToday(settingsId: string, dateIso: string): Promise<void> {
  await execute(`UPDATE user_settings SET last_overdue_notified_date = $1 WHERE id = $2`, [
    dateIso,
    settingsId,
  ]);
}

async function sendToUser(
  bot: Telegraf,
  telegramChatId: string,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<void> {
  await bot.telegram.sendMessage(telegramChatId, text, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function deliverTodayPlan(
  bot: Telegraf,
  user: UserSettingsRow,
  now: Date,
  options?: { testPrefix?: boolean; force?: boolean },
): Promise<'sent' | 'empty'> {
  const today = todayIsoDateInTimeZone(user.timezone, now);
  await syncCareObligationsForUser(user.telegram_chat_id, today);
  const items = await findTodayPlanItems(user.telegram_chat_id, today);
  const payload = buildDailyTodayNotificationMessage(items);

  if (!payload) {
    if (options?.testPrefix) {
      await sendToUser(
        bot,
        user.telegram_chat_id,
        '🧪 <b>Тест</b>\n\n' + buildTodayPlanMessage(items).text,
      );
      return 'empty';
    }
    return 'empty';
  }

  const text = options?.testPrefix
    ? `🧪 <b>Тест</b>\n\n${payload.text}`
    : payload.text;
  await sendToUser(bot, user.telegram_chat_id, text, payload.reply_markup);
  if (!options?.testPrefix && !options?.force) {
    await markUserNotifiedToday(user.id, today);
  }
  return 'sent';
}

async function deliverOverdueReminder(
  bot: Telegraf,
  user: UserSettingsRow,
  now: Date,
  options?: { testPrefix?: boolean; force?: boolean },
): Promise<'sent' | 'empty'> {
  const today = todayIsoDateInTimeZone(user.timezone, now);
  await syncCareObligationsForUser(user.telegram_chat_id, today);
  const obligations = await listOpenObligationsForUser(user.telegram_chat_id);
  const payload = buildDailyOverdueNotificationMessage(obligations);

  if (!payload) {
    if (options?.testPrefix) {
      await sendToUser(
        bot,
        user.telegram_chat_id,
        '🧪 <b>Тест просрочки</b>\n\n' + buildOverdueMessage(obligations).text,
      );
      return 'empty';
    }
    return 'empty';
  }

  const text = options?.testPrefix
    ? `🧪 <b>Тест просрочки</b>\n\n${payload.text}`
    : payload.text;
  await sendToUser(bot, user.telegram_chat_id, text, payload.reply_markup);
  if (!options?.testPrefix && !options?.force) {
    await markUserOverdueNotifiedToday(user.id, today);
  }
  return 'sent';
}

export async function sendTodayPlanCommand(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  const user = await loadUserSettings(telegramChatId);
  if (!user) {
    throw new Error('user_settings not found for chat');
  }
  const today = todayIsoDateInTimeZone(user.timezone, now);
  await syncCareObligationsForUser(telegramChatId, today);
  const items = await findTodayPlanItems(telegramChatId, today);
  const payload = buildTodayPlanMessage(items);
  await sendToUser(bot, telegramChatId, payload.text, payload.reply_markup);
}

export async function sendOverdueCommand(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  const user = await loadUserSettings(telegramChatId);
  if (!user) {
    throw new Error('user_settings not found for chat');
  }
  const today = todayIsoDateInTimeZone(user.timezone, now);
  await syncCareObligationsForUser(telegramChatId, today);
  const obligations = await listOpenObligationsForUser(telegramChatId);
  const payload = buildOverdueMessage(obligations);
  await sendToUser(bot, telegramChatId, payload.text, payload.reply_markup);
}

export async function checkAndSendNotificationsForUser(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  const user = await loadUserSettings(telegramChatId);
  if (!user) {
    return;
  }

  const todayDue = isNotificationDue(
    user.notification_time,
    user.timezone,
    user.last_notified_date,
    now,
  );
  const overdueDue = isNotificationDue(
    user.notification_time,
    user.timezone,
    user.last_overdue_notified_date,
    now,
  );

  if (todayDue) {
    try {
      await deliverTodayPlan(bot, user, now);
    } catch (error) {
      console.error(`Failed today plan notification for ${telegramChatId}:`, error);
    }
  }

  if (overdueDue) {
    try {
      await deliverOverdueReminder(bot, user, now);
    } catch (error) {
      console.error(`Failed overdue notification for ${telegramChatId}:`, error);
    }
  }
}

export async function checkAndSendNotifications(bot: Telegraf, now = new Date()): Promise<void> {
  const users = await loadAllUserSettings();

  for (const user of users) {
    try {
      await checkAndSendNotificationsForUser(bot, user.telegram_chat_id, now);
    } catch (error) {
      console.error(
        `Failed to send care notifications to chat ${user.telegram_chat_id}:`,
        error,
      );
    }
  }
}

/** Немедленная отправка уведомления админу (не меняет last_* при пустом списке). */
export async function sendTestCareNotification(
  bot: Telegraf,
  telegramChatId: string,
  now = new Date(),
): Promise<void> {
  const user = await loadUserSettings(telegramChatId);
  if (!user) {
    throw new Error('user_settings not found for chat');
  }

  await deliverTodayPlan(bot, user, now, { testPrefix: true });
  await deliverOverdueReminder(bot, user, now, { testPrefix: true });
}
