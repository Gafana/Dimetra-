/**
 * Startup migration `002_user_settings_timezone`.
 * Per-user IANA timezone and last_notified_date for idempotent daily notifications.
 */
export const USER_SETTINGS_TIMEZONE_MIGRATION_ID = '002_user_settings_timezone';

export const USER_SETTINGS_TIMEZONE_MIGRATION_STATEMENTS: readonly string[] = [
  `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Moscow'`,
  `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_notified_date TEXT`,
];
