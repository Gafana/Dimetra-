import pg from 'pg';

const { Pool } = pg;

let poolInstance: pg.Pool | undefined;

/** @internal */
export function hasPool(): boolean {
  return poolInstance !== undefined;
}

function shouldUseSsl(connectionString: string): boolean {
  if (process.env.PGSSLMODE === 'disable') {
    return false;
  }
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) {
    return false;
  }
  return true;
}

export function getPool(): pg.Pool {
  if (!poolInstance) {
    throw new Error('Database pool is not initialized. Call initDb() first.');
  }
  return poolInstance;
}

export function createPool(connectionString: string): pg.Pool {
  return new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
}

export function setPool(pool: pg.Pool | undefined): void {
  poolInstance = pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export async function execute(text: string, params: unknown[] = []): Promise<void> {
  await getPool().query(text, params);
}
