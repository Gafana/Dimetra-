import '../src/loadEnv.ts';
import { closeDb, initDb } from '../src/db/initDb.ts';

async function main(): Promise<void> {
  await initDb();
  console.log('Database initialization finished.');
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
