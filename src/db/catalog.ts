export type Season = 'summer' | 'winter';

export interface SeasonCareIntervals {
  /** Интервал полива в днях */
  wateringDays: number;
  /** Интервал подкормки в днях */
  feedingDays: number;
}

export interface PlantCatalogEntry {
  id: string;
  name: string;
  seasons: Record<Season, SeasonCareIntervals>;
}

export const PLANT_CATALOG: readonly PlantCatalogEntry[] = [
  {
    id: 'monstera',
    name: 'Монстера',
    seasons: {
      summer: { wateringDays: 6, feedingDays: 14 },
      winter: { wateringDays: 12, feedingDays: 30 },
    },
  },
  {
    id: 'ficus-benjamina',
    name: 'Фикус Бенджамина',
    seasons: {
      summer: { wateringDays: 7, feedingDays: 14 },
      winter: { wateringDays: 12, feedingDays: 30 },
    },
  },
  {
    id: 'zamioculcas',
    name: 'Замиокулькас',
    seasons: {
      summer: { wateringDays: 18, feedingDays: 30 },
      winter: { wateringDays: 28, feedingDays: 60 },
    },
  },
  {
    id: 'aloe-vera',
    name: 'Алоэ Вера',
    seasons: {
      summer: { wateringDays: 14, feedingDays: 30 },
      winter: { wateringDays: 21, feedingDays: 60 },
    },
  },
  {
    id: 'kalanchoe',
    name: 'Каланхоэ',
    seasons: {
      summer: { wateringDays: 10, feedingDays: 21 },
      winter: { wateringDays: 16, feedingDays: 30 },
    },
  },
] as const;
