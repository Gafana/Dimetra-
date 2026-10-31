import fs from 'node:fs';
import path from 'node:path';
import type { PlantCatalogEntry, PlantCatalogFile } from './catalogTypes.js';
import { LEGACY_CATALOG_ENTRIES } from './legacyCatalog.js';
import { queryOne } from './pool.js';
import { inferLightLevelFromText } from '../lib/inferLightLevel.js';
import {
  createPlantCatalogEntry,
  mapScrapedEntryToUpsert,
} from '../services/plantCatalogService.js';

function catalogFilePath(): string {
  return path.join(process.cwd(), 'data', 'plant-catalog.json');
}

function mergeSeedEntries(plants: PlantCatalogEntry[]): PlantCatalogEntry[] {
  const byId = new Map<string, PlantCatalogEntry>();
  for (const entry of plants) {
    byId.set(entry.id, normalizeSeedEntry(entry));
  }
  for (const legacy of LEGACY_CATALOG_ENTRIES) {
    const existing = byId.get(legacy.id);
    byId.set(legacy.id, {
      ...(existing ?? legacy),
      ...legacy,
      imageUrl: existing?.imageUrl || legacy.imageUrl,
      lightLevel: legacy.lightLevel,
      seasons: legacy.seasons,
      encyclopedia: existing?.encyclopedia ?? legacy.encyclopedia,
    });
  }
  return [...byId.values()];
}

function normalizeSeedEntry(entry: PlantCatalogEntry): PlantCatalogEntry {
  return {
    ...entry,
    imageUrl: entry.imageUrl ?? '',
    lightLevel: entry.lightLevel ?? inferLightLevelFromText(entry.encyclopedia?.light),
  };
}

function loadSeedFile(): PlantCatalogEntry[] | undefined {
  const filePath = catalogFilePath();
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PlantCatalogFile;
  if (!Array.isArray(parsed.plants)) {
    return undefined;
  }
  return mergeSeedEntries(parsed.plants);
}

export async function seedPlantCatalogIfEmpty(): Promise<void> {
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM plant_catalog`);
  const count = Number(row?.count ?? 0);
  if (count > 0) {
    return;
  }

  const entries = loadSeedFile() ?? [...LEGACY_CATALOG_ENTRIES];
  console.log(`Seeding plant_catalog (${entries.length} entries)…`);

  for (const entry of entries) {
    try {
      await createPlantCatalogEntry(mapScrapedEntryToUpsert(entry));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already exists')) {
        console.warn(`Seed skip ${entry.id}: ${message}`);
      }
    }
  }
}
