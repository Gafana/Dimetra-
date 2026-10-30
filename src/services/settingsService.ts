import { v4 as uuidv4 } from 'uuid';
import { execute, queryOne } from '../db/pool.js';
import type { UserSettingsRow } from '../types/models.js';

const DEFAULT_NOTIFICATION_TIME = '09:00:00';

export async function findSettingsByChatId(
  telegramChatId: string,
): Promise<UserSettingsRow | undefined> {
  return queryOne<UserSettingsRow>(
    `SELECT id, telegram_chat_id, notification_time
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
  };

  await execute(
    `INSERT INTO user_settings (id, telegram_chat_id, notification_time)
     VALUES ($1, $2, $3)`,
    [row.id, row.telegram_chat_id, row.notification_time],
  );

  return row;
}

export async function updateNotificationTime(
  telegramChatId: string,
  notificationTime: string,
): Promise<UserSettingsRow> {
  const settings = await ensureSettingsForChat(telegramChatId);

  await execute(`UPDATE user_settings SET notification_time = $1 WHERE id = $2`, [
    notificationTime,
    settings.id,
  ]);

  return { ...settings, notification_time: notificationTime };
}
