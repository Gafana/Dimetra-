import { v4 as uuidv4 } from 'uuid';
import { execute, queryOne } from '../db/pool.js';
import { DEFAULT_USER_TIMEZONE } from '../lib/time.js';
import type { UserSettingsRow } from '../types/models.js';

const DEFAULT_NOTIFICATION_TIME = '09:00:00';

const SETTINGS_COLUMNS =
  'id, telegram_chat_id, notification_time, timezone, last_notified_date';

export async function findSettingsByChatId(
  telegramChatId: string,
): Promise<UserSettingsRow | undefined> {
  return queryOne<UserSettingsRow>(
    `SELECT ${SETTINGS_COLUMNS}
     FROM user_settings
     WHERE telegram_chat_id = $1`,
    [telegramChatId],
  );
}

export async function ensureSettingsForChat(telegramChatId: string): Promise<UserSettingsRow> {
  const existing = await findSettingsByChatId(telegramChatId);
  if (existing) {
    return existing;
  }

  const row: UserSettingsRow = {
    id: uuidv4(),
    telegram_chat_id: telegramChatId,
    notification_time: DEFAULT_NOTIFICATION_TIME,
    timezone: DEFAULT_USER_TIMEZONE,
    last_notified_date: null,
  };

  await execute(
    `INSERT INTO user_settings (id, telegram_chat_id, notification_time, timezone)
     VALUES ($1, $2, $3, $4)`,
    [row.id, row.telegram_chat_id, row.notification_time, row.timezone],
  );

  return row;
}

export async function updateNotificationTime(
  telegramChatId: string,
  notificationTime: string,
): Promise<UserSettingsRow> {
  return updateUserSettings(telegramChatId, { notification_time: notificationTime });
}

export async function updateUserSettings(
  telegramChatId: string,
  patch: { notification_time?: string; timezone?: string },
): Promise<UserSettingsRow> {
  const settings = await ensureSettingsForChat(telegramChatId);

  const notificationTime = patch.notification_time ?? settings.notification_time;
  const timezone = patch.timezone ?? settings.timezone;

  await execute(
    `UPDATE user_settings
     SET notification_time = $1, timezone = $2
     WHERE id = $3`,
    [notificationTime, timezone, settings.id],
  );

  return {
    ...settings,
    notification_time: notificationTime,
    timezone,
  };
}
