export {
  PLANT_CATALOG,
  type PlantCatalogEntry,
  type Season,
  type SeasonCareIntervals,
} from '../db/catalog.js';

import { PLANT_CATALOG, type PlantCatalogEntry, type Season } from '../db/catalog.js';

export function findCatalogPlant(catalogId: string): PlantCatalogEntry | undefined {
  return PLANT_CATALOG.find((entry) => entry.id === catalogId);
}

export function getCareIntervals(
  catalogId: string,
  season: Season,
): { wateringDays: number; feedingDays: number } {
  const plant = findCatalogPlant(catalogId);
  if (!plant) {
    throw new Error(`Unknown catalog_id: ${catalogId}`);
  }
  return plant.seasons[season];
}
