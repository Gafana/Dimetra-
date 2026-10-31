export type Season = 'summer' | 'winter';

/** Освещение для средней полосы России */
export type LightRequirementLevel = 'window_moscow_ok' | 'bright_window' | 'grow_lamp';

export interface SeasonCareIntervals {
  wateringDays: number;
  feedingDays: number;
}

export interface PlantEncyclopediaFields {
  family?: string;
  origin?: string;
  flowering?: string;
  growth?: string;
  light?: string;
  temperature?: string;
  watering?: string;
  humidity?: string;
  feeding?: string;
  dormancy?: string;
  repotting?: string;
  propagation?: string;
}

/** Компактная запись для экрана «Добавить» (без описания и JSON энциклопедии). */
export interface PlantCatalogPickerEntry {
  id: string;
  name: string;
  nameLatin?: string;
  imageUrl: string;
  seasons: Record<Season, SeasonCareIntervals>;
}

export interface PlantCatalogEntry {
  id: string;
  name: string;
  nameLatin?: string;
  sourceUrl?: string;
  /** Обязательно в паспорте (URL фото) */
  imageUrl: string;
  description?: string;
  /** Лето/зима — интервалы полива и подкормки (редактируются вручную) */
  seasons: Record<Season, SeasonCareIntervals>;
  wateringNotes?: string;
  feedingProduct?: string;
  feedingNotes?: string;
  lightLevel: LightRequirementLevel;
  lightNotes?: string;
  encyclopedia?: PlantEncyclopediaFields;
  updatedAt?: string;
}

export interface PlantCatalogFile {
  version: number;
  source: string;
  scrapedAt?: string;
  plants: PlantCatalogEntry[];
}
