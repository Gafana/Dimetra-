import { fetchCatalogPicker, type PlantCatalogPickerEntry } from '../api/index.js';

let cache: PlantCatalogPickerEntry[] | null = null;
let inflight: Promise<PlantCatalogPickerEntry[]> | null = null;

export function invalidateCatalogPickerCache(): void {
  cache = null;
  inflight = null;
}

/** Один запрос на сессию — дальше поиск только на клиенте. */
export function loadCatalogPicker(): Promise<PlantCatalogPickerEntry[]> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (inflight) {
    return inflight;
  }
  inflight = fetchCatalogPicker()
    .then((items) => {
      cache = items;
      return items;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
