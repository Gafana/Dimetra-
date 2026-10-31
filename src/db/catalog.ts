export type {
  LightRequirementLevel,
  PlantCatalogEntry,
  PlantCatalogFile,
  PlantCatalogPickerEntry,
  PlantEncyclopediaFields,
  Season,
  SeasonCareIntervals,
} from './catalogTypes.js';

export { LEGACY_CATALOG_ENTRIES } from './legacyCatalog.js';
export { seedPlantCatalogIfEmpty } from './seedPlantCatalog.js';

import type { PlantCatalogEntry, Season } from './catalogTypes.js';
import {
  findPlantCatalogById,
  listPlantCatalog,
  listPlantCatalogPicker,
} from '../services/plantCatalogService.js';

export async function findCatalogPlant(catalogId: string): Promise<PlantCatalogEntry | undefined> {
  return findPlantCatalogById(catalogId);
}

export async function getPlantCatalog(search?: string): Promise<PlantCatalogEntry[]> {
  return listPlantCatalog(search);
}

export async function getPlantCatalogPicker(): Promise<
  import('./catalogTypes.js').PlantCatalogPickerEntry[]
> {
  return listPlantCatalogPicker();
}

export async function getCareIntervals(
  catalogId: string,
  season: Season,
): Promise<{ wateringDays: number; feedingDays: number }> {
  const plant = await findCatalogPlant(catalogId);
  if (!plant) {
    throw new Error(`Unknown catalog_id: ${catalogId}`);
  }
  return plant.seasons[season];
}
