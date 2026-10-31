import type { PlantCatalogEntry } from './catalogTypes.js';

const PLACEHOLDER_IMAGE =
  'https://floralworld.ru/images/plants/monstera/thumb_monstera_deliciosa.jpg';

/** Ручные профили с точными интервалами (совместимость со старыми catalog_id в БД). */
export const LEGACY_CATALOG_ENTRIES: readonly PlantCatalogEntry[] = [
  {
    id: 'monstera',
    name: 'Монстера',
    nameLatin: 'Monstera',
    imageUrl: PLACEHOLDER_IMAGE,
    lightLevel: 'bright_window',
    feedingProduct: 'Удобрение для декоративно-лиственных',
    seasons: {
      summer: { wateringDays: 6, feedingDays: 14 },
      winter: { wateringDays: 12, feedingDays: 30 },
    },
  },
  {
    id: 'ficus-benjamina',
    name: 'Фикус Бенджамина',
    nameLatin: 'Ficus benjamina',
    imageUrl: PLACEHOLDER_IMAGE,
    lightLevel: 'bright_window',
    feedingProduct: 'Удобрение для декоративно-лиственных',
    seasons: {
      summer: { wateringDays: 7, feedingDays: 14 },
      winter: { wateringDays: 12, feedingDays: 30 },
    },
  },
  {
    id: 'zamioculcas',
    name: 'Замиокулькас',
    nameLatin: 'Zamioculcas',
    imageUrl: PLACEHOLDER_IMAGE,
    lightLevel: 'window_moscow_ok',
    feedingProduct: 'Удобрение для суккулентов и замиокулькаса',
    seasons: {
      summer: { wateringDays: 18, feedingDays: 30 },
      winter: { wateringDays: 28, feedingDays: 60 },
    },
  },
  {
    id: 'aloe-vera',
    name: 'Алоэ Вера',
    nameLatin: 'Aloe vera',
    imageUrl: PLACEHOLDER_IMAGE,
    lightLevel: 'bright_window',
    feedingProduct: 'Удобрение для кактусов и суккулентов',
    seasons: {
      summer: { wateringDays: 14, feedingDays: 30 },
      winter: { wateringDays: 21, feedingDays: 60 },
    },
  },
  {
    id: 'kalanchoe',
    name: 'Каланхоэ',
    nameLatin: 'Kalanchoe',
    imageUrl: PLACEHOLDER_IMAGE,
    lightLevel: 'bright_window',
    feedingProduct: 'Удобрение для кактусов и суккулентов',
    seasons: {
      summer: { wateringDays: 10, feedingDays: 21 },
      winter: { wateringDays: 16, feedingDays: 30 },
    },
  },
] as const;
