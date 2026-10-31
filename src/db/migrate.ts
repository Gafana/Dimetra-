import { execute } from './pool.js';
import { PROMO_MIGRATION_ID } from './migrations/001_promo_codes.js';

/**
 * Records migrations whose DDL already ran via SCHEMA_STATEMENTS (idempotent CREATE IF NOT EXISTS).
 * New tables live in src/db/migrations and are also applied on every backend start.
 */
export async function markAppliedMigrations(): Promise<void> {
  await execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  await execute(
    `INSERT INTO schema_migrations (id)
     VALUES ($1)
     ON CONFLICT (id) DO NOTHING`,
    [PROMO_MIGRATION_ID],
  );
}
