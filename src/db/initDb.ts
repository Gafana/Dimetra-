import { markAppliedMigrations } from './migrate.js';
import { createPool, execute, getPool, hasPool, setPool } from './pool.js';
import { seedPlantCatalogIfEmpty } from './seedPlantCatalog.js';
import { SCHEMA_STATEMENTS } from './schema.js';

async function runSchemaMigrations(): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await execute(statement);
  }
}

function resolveDatabaseUrl(connectionString?: string): string {
  const url =
    connectionString ??
    process.env.DATABASE_URL?.trim() ??
    process.env.POSTGRES_URL?.trim();

  if (!url) {
    throw new Error(
      'DATABASE_URL is required (Neon: run `neon env pull` or add pooled connection string to .env / .env.local)',
    );
  }

  return url;
}

/**
 * Подключается к PostgreSQL (Neon pooled DATABASE_URL), создаёт таблицы при первом запуске.
 */
export async function initDb(connectionString?: string): Promise<void> {
  const url = resolveDatabaseUrl(connectionString);

  const pool = createPool(url);
  setPool(pool);

  await getPool().query('SELECT 1');
  await runSchemaMigrations();
  await markAppliedMigrations();
  await seedPlantCatalogIfEmpty();

  console.log(
    'PostgreSQL connected; tables ready: rooms, user_plants, care_history, user_settings, plant_catalog, promo_codes, promo_code_activations',
  );
}

export async function closeDb(): Promise<void> {
  if (!hasPool()) {
    return;
  }
  const pool = getPool();
  await pool.end();
  setPool(undefined);
}
