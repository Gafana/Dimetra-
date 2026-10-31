/**
 * Загружает data/plant-catalog.json в plant_catalog (пропуск существующих id).
 * npx tsx scripts/sync-plant-catalog-to-db.ts
 */
import '../src/loadEnv.js';
import { closeDb, initDb } from '../src/db/initDb.js';
import fs from 'node:fs';
import path from 'node:path';
import type { PlantCatalogFile } from '../src/db/catalogTypes.js';
import {
  createPlantCatalogEntry,
  findPlantCatalogById,
  mapScrapedEntryToUpsert,
  updatePlantCatalogEntry,
} from '../src/services/plantCatalogService.js';

async function main(): Promise<void> {
  const updateExisting = process.argv.includes('--update');

  await initDb();
  const filePath = path.join(process.cwd(), 'data', 'plant-catalog.json');
  if (!fs.existsSync(filePath)) {
    throw new Error('Missing data/plant-catalog.json — run npm run catalog:scrape first');
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PlantCatalogFile;

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const plant of parsed.plants) {
    const payload = mapScrapedEntryToUpsert(plant);
    const existing = await findPlantCatalogById(plant.id);
    if (existing) {
      if (updateExisting) {
        await updatePlantCatalogEntry(plant.id, payload);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await createPlantCatalogEntry(payload);
    created++;
  }

  console.log(`Done: created ${created}, updated ${updated}, skipped ${skipped}`);
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
