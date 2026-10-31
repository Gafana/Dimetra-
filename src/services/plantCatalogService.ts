import { v4 as uuidv4 } from 'uuid';
import type {
  LightRequirementLevel,
  PlantCatalogEntry,
  PlantCatalogPickerEntry,
  PlantEncyclopediaFields,
  Season,
} from '../db/catalogTypes.js';
import { execute, query, queryOne } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import { inferLightLevelFromText } from '../lib/inferLightLevel.js';
import { nowIsoDateTime } from '../lib/dates.js';

interface PlantCatalogRow {
  id: string;
  name: string;
  name_latin: string | null;
  image_url: string;
  description: string | null;
  watering_notes: string | null;
  feeding_product: string | null;
  feeding_notes: string | null;
  light_level: LightRequirementLevel;
  light_notes: string | null;
  watering_summer_days: number;
  watering_winter_days: number;
  feeding_summer_days: number;
  feeding_winter_days: number;
  encyclopedia_json: PlantEncyclopediaFields | null;
  source_url: string | null;
  updated_at: string;
}

export interface UpsertPlantCatalogInput {
  id?: string;
  name: string;
  nameLatin?: string | null;
  imageUrl: string;
  description?: string | null;
  wateringNotes?: string | null;
  feedingProduct?: string | null;
  feedingNotes?: string | null;
  lightLevel: LightRequirementLevel;
  lightNotes?: string | null;
  seasons: Record<Season, { wateringDays: number; feedingDays: number }>;
  encyclopedia?: PlantEncyclopediaFields | null;
  sourceUrl?: string | null;
}

function rowToEntry(row: PlantCatalogRow): PlantCatalogEntry {
  return {
    id: row.id,
    name: row.name,
    nameLatin: row.name_latin ?? undefined,
    imageUrl: row.image_url,
    description: row.description ?? undefined,
    wateringNotes: row.watering_notes ?? undefined,
    feedingProduct: row.feeding_product ?? undefined,
    feedingNotes: row.feeding_notes ?? undefined,
    lightLevel: row.light_level,
    lightNotes: row.light_notes ?? undefined,
    seasons: {
      summer: {
        wateringDays: row.watering_summer_days,
        feedingDays: row.feeding_summer_days,
      },
      winter: {
        wateringDays: row.watering_winter_days,
        feedingDays: row.feeding_winter_days,
      },
    },
    encyclopedia:
      row.encyclopedia_json && typeof row.encyclopedia_json === 'object'
        ? row.encyclopedia_json
        : undefined,
    sourceUrl: row.source_url ?? undefined,
    updatedAt: row.updated_at,
  };
}

interface PlantCatalogPickerRow {
  id: string;
  name: string;
  name_latin: string | null;
  image_url: string;
  watering_summer_days: number;
  watering_winter_days: number;
  feeding_summer_days: number;
  feeding_winter_days: number;
}

let pickerCache: PlantCatalogPickerEntry[] | null = null;

function rowToPickerEntry(row: PlantCatalogPickerRow): PlantCatalogPickerEntry {
  return {
    id: row.id,
    name: row.name,
    nameLatin: row.name_latin ?? undefined,
    imageUrl: row.image_url,
    seasons: {
      summer: {
        wateringDays: row.watering_summer_days,
        feedingDays: row.feeding_summer_days,
      },
      winter: {
        wateringDays: row.watering_winter_days,
        feedingDays: row.feeding_winter_days,
      },
    },
  };
}

export function invalidatePlantCatalogPickerCache(): void {
  pickerCache = null;
}

export async function listPlantCatalogPicker(): Promise<PlantCatalogPickerEntry[]> {
  if (pickerCache) {
    return pickerCache;
  }

  const rows = await query<PlantCatalogPickerRow>(
    `SELECT id, name, name_latin, image_url,
            watering_summer_days, watering_winter_days,
            feeding_summer_days, feeding_winter_days
     FROM plant_catalog
     ORDER BY name`,
  );

  pickerCache = rows.map(rowToPickerEntry);
  return pickerCache;
}

function slugifyId(name: string, nameLatin?: string | null): string {
  const base = (nameLatin?.trim() || name.trim())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || uuidv4().slice(0, 8);
}

export async function listPlantCatalog(search?: string): Promise<PlantCatalogEntry[]> {
  const q = search?.trim().toLowerCase();
  let rows: PlantCatalogRow[];

  if (q) {
    rows = await query<PlantCatalogRow>(
      `SELECT *
       FROM plant_catalog
       WHERE LOWER(name) LIKE $1
          OR LOWER(COALESCE(name_latin, '')) LIKE $1
          OR id LIKE $1
       ORDER BY name`,
      [`%${q}%`],
    );
  } else {
    rows = await query<PlantCatalogRow>(`SELECT * FROM plant_catalog ORDER BY name`);
  }

  return rows.map(rowToEntry).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export async function findPlantCatalogById(id: string): Promise<PlantCatalogEntry | undefined> {
  const row = await queryOne<PlantCatalogRow>(`SELECT * FROM plant_catalog WHERE id = $1`, [id]);
  return row ? rowToEntry(row) : undefined;
}

export async function createPlantCatalogEntry(
  input: UpsertPlantCatalogInput,
): Promise<PlantCatalogEntry> {
  const id = input.id?.trim() || slugifyId(input.name, input.nameLatin);
  const existing = await findPlantCatalogById(id);
  if (existing) {
    throw new HttpError('Plant catalog id already exists', 409);
  }

  const updatedAt = nowIsoDateTime();
  await execute(
    `INSERT INTO plant_catalog (
       id, name, name_latin, image_url, description,
       watering_notes, feeding_product, feeding_notes,
       light_level, light_notes,
       watering_summer_days, watering_winter_days,
       feeding_summer_days, feeding_winter_days,
       encyclopedia_json, source_url, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id,
      input.name.trim(),
      input.nameLatin?.trim() || null,
      input.imageUrl.trim(),
      input.description?.trim() || null,
      input.wateringNotes?.trim() || null,
      input.feedingProduct?.trim() || null,
      input.feedingNotes?.trim() || null,
      input.lightLevel,
      input.lightNotes?.trim() || null,
      input.seasons.summer.wateringDays,
      input.seasons.winter.wateringDays,
      input.seasons.summer.feedingDays,
      input.seasons.winter.feedingDays,
      input.encyclopedia ? JSON.stringify(input.encyclopedia) : null,
      input.sourceUrl?.trim() || null,
      updatedAt,
    ],
  );

  invalidatePlantCatalogPickerCache();

  const created = await findPlantCatalogById(id);
  if (!created) {
    throw new HttpError('Failed to create catalog entry', 500);
  }
  return created;
}

export async function updatePlantCatalogEntry(
  id: string,
  input: UpsertPlantCatalogInput,
): Promise<PlantCatalogEntry> {
  const current = await findPlantCatalogById(id);
  if (!current) {
    throw new HttpError('Plant not found in catalog', 404);
  }

  const updatedAt = nowIsoDateTime();
  await execute(
    `UPDATE plant_catalog SET
       name = $2,
       name_latin = $3,
       image_url = $4,
       description = $5,
       watering_notes = $6,
       feeding_product = $7,
       feeding_notes = $8,
       light_level = $9,
       light_notes = $10,
       watering_summer_days = $11,
       watering_winter_days = $12,
       feeding_summer_days = $13,
       feeding_winter_days = $14,
       encyclopedia_json = $15,
       source_url = $16,
       updated_at = $17
     WHERE id = $1`,
    [
      id,
      input.name.trim(),
      input.nameLatin?.trim() || null,
      input.imageUrl.trim(),
      input.description?.trim() || null,
      input.wateringNotes?.trim() || null,
      input.feedingProduct?.trim() || null,
      input.feedingNotes?.trim() || null,
      input.lightLevel,
      input.lightNotes?.trim() || null,
      input.seasons.summer.wateringDays,
      input.seasons.winter.wateringDays,
      input.seasons.summer.feedingDays,
      input.seasons.winter.feedingDays,
      input.encyclopedia ? JSON.stringify(input.encyclopedia) : null,
      input.sourceUrl?.trim() || null,
      updatedAt,
    ],
  );

  invalidatePlantCatalogPickerCache();

  const updated = await findPlantCatalogById(id);
  if (!updated) {
    throw new HttpError('Failed to update catalog entry', 500);
  }
  return updated;
}

export async function deletePlantCatalogEntry(id: string): Promise<void> {
  const inUse = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok FROM user_plants WHERE catalog_id = $1 LIMIT 1`,
    [id],
  );
  if (inUse) {
    throw new HttpError('Нельзя удалить: вид используется у ваших растений', 409);
  }

  const result = await queryOne<{ id: string }>(
    `DELETE FROM plant_catalog WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!result) {
    throw new HttpError('Plant not found in catalog', 404);
  }

  invalidatePlantCatalogPickerCache();
}

/** Импорт из JSON-файла скрапера → поля паспорта */
export function mapScrapedEntryToUpsert(entry: PlantCatalogEntry): UpsertPlantCatalogInput {
  const feedingProduct =
    entry.feedingProduct ??
    (entry.encyclopedia?.feeding
      ? entry.encyclopedia.feeding.split(/[.;]/)[0]?.trim()
      : undefined);

  return {
    id: entry.id,
    name: entry.name,
    nameLatin: entry.nameLatin,
    imageUrl: entry.imageUrl || '',
    description: entry.description,
    wateringNotes: entry.wateringNotes ?? entry.encyclopedia?.watering,
    feedingProduct: feedingProduct ?? undefined,
    feedingNotes: entry.feedingNotes ?? entry.encyclopedia?.feeding,
    lightLevel: entry.lightLevel ?? inferLightLevelFromText(entry.encyclopedia?.light),
    lightNotes: entry.lightNotes ?? entry.encyclopedia?.light,
    seasons: entry.seasons,
    encyclopedia: entry.encyclopedia,
    sourceUrl: entry.sourceUrl,
  };
}
