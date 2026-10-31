import { PROMO_MIGRATION_STATEMENTS } from './migrations/001_promo_codes.js';
import { USER_SETTINGS_TIMEZONE_MIGRATION_STATEMENTS } from './migrations/002_user_settings_timezone.js';
import { CARE_OBLIGATIONS_MIGRATION_STATEMENTS } from './migrations/003_care_obligations.js';

/** DDL for Dimetra — applied on startup via initDb(). Promo DDL is migration 001_promo_codes. */
export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    telegram_chat_id TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_plants (
    id TEXT PRIMARY KEY NOT NULL,
    custom_name TEXT NOT NULL,
    room_id TEXT,
    telegram_chat_id TEXT NOT NULL,
    catalog_id TEXT NOT NULL,
    last_repot_date TEXT,
    current_season TEXT NOT NULL DEFAULT 'summer',
    next_watering_date TEXT,
    next_feeding_date TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS care_history (
    id TEXT PRIMARY KEY NOT NULL,
    plant_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    done_at TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES user_plants (id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY NOT NULL,
    telegram_chat_id TEXT NOT NULL,
    notification_time TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rooms_telegram_chat_id ON rooms (telegram_chat_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_plants_room_id ON user_plants (room_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_plants_telegram_chat_id ON user_plants (telegram_chat_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_plants_catalog_id ON user_plants (catalog_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_plants_next_watering_date ON user_plants (next_watering_date)`,
  `CREATE INDEX IF NOT EXISTS idx_care_history_plant_id ON care_history (plant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_care_history_done_at ON care_history (done_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_telegram_chat_id ON user_settings (telegram_chat_id)`,
  `CREATE TABLE IF NOT EXISTS plant_catalog (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    name_latin TEXT,
    image_url TEXT NOT NULL DEFAULT '',
    description TEXT,
    watering_notes TEXT,
    feeding_product TEXT,
    feeding_notes TEXT,
    light_level TEXT NOT NULL DEFAULT 'bright_window',
    light_notes TEXT,
    watering_summer_days INTEGER NOT NULL DEFAULT 7,
    watering_winter_days INTEGER NOT NULL DEFAULT 14,
    feeding_summer_days INTEGER NOT NULL DEFAULT 14,
    feeding_winter_days INTEGER NOT NULL DEFAULT 30,
    encyclopedia_json JSONB,
    source_url TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_plant_catalog_name ON plant_catalog (name)`,
  `ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS photo_url TEXT`,
  ...PROMO_MIGRATION_STATEMENTS,
  ...USER_SETTINGS_TIMEZONE_MIGRATION_STATEMENTS,
  ...CARE_OBLIGATIONS_MIGRATION_STATEMENTS,
];
