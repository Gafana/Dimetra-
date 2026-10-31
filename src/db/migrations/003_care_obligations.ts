/**
 * Startup migration `003_care_obligations`.
 * Tracks open/closed overdue care deadlines separately from the next schedule date.
 */
export const CARE_OBLIGATIONS_MIGRATION_ID = '003_care_obligations';

export const CARE_OBLIGATIONS_MIGRATION_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS care_obligations (
    id TEXT PRIMARY KEY NOT NULL,
    plant_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL,
    closed_at TEXT,
    completion_history_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES user_plants (id) ON DELETE CASCADE,
    FOREIGN KEY (completion_history_id) REFERENCES care_history (id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_care_obligations_plant_id ON care_obligations (plant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_care_obligations_due_date ON care_obligations (due_date)`,
  `CREATE INDEX IF NOT EXISTS idx_care_obligations_status ON care_obligations (status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_care_obligations_one_open_per_action
     ON care_obligations (plant_id, action_type)
     WHERE status = 'open'`,
  `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_overdue_notified_date TEXT`,
];
