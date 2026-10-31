import '../src/loadEnv.js';
import { closeDb, initDb } from '../src/db/initDb.js';
import { queryOne } from '../src/db/pool.js';

async function main(): Promise<void> {
  await initDb();
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM plant_catalog`);
  console.log('plant_catalog count:', row?.count ?? '0');
  await closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
