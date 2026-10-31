import type { PlantEncyclopediaFields, Season, SeasonCareIntervals } from '../db/catalogTypes.js';

const DEFAULT_SUMMER: SeasonCareIntervals = { wateringDays: 7, feedingDays: 14 };
const DEFAULT_WINTER: SeasonCareIntervals = { wateringDays: 14, feedingDays: 30 };

function clampDays(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Извлекает «раз в N дней» из русскоязычного текста ухода. */
export function parseWateringDaysFromText(text: string | undefined): number | undefined {
  if (!text) {
    return undefined;
  }
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  const dayMatch = normalized.match(/(?:раз|1)\s*(?:в|[/])?\s*(\d{1,2})\s*(?:дн|д\.|дней|дня)/);
  if (dayMatch) {
    return clampDays(Number(dayMatch[1]), 2, 45);
  }

  if (/раз\s*(?:в|[/])?\s*недел/.test(normalized) || /еженедел/.test(normalized)) {
    return 7;
  }
  if (/раз\s*(?:в|[/])?\s*2\s*недел/.test(normalized) || /две\s*недел/.test(normalized)) {
    return 14;
  }
  if (/раз\s*(?:в|[/])?\s*месяц/.test(normalized)) {
    return 30;
  }

  if (/редк/.test(normalized) || /засуш/.test(normalized) || /сух/.test(normalized)) {
    return 18;
  }
  if (/обильн/.test(normalized) || /част/.test(normalized) || /регуляр/.test(normalized)) {
    return 5;
  }
  if (/умерен/.test(normalized)) {
    return 8;
  }

  return undefined;
}

export function parseFeedingDaysFromText(text: string | undefined): number | undefined {
  if (!text) {
    return undefined;
  }
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  const dayMatch = normalized.match(/(?:раз|1)\s*(?:в|[/])?\s*(\d{1,2})\s*(?:дн|д\.|дней|дня)/);
  if (dayMatch) {
    return clampDays(Number(dayMatch[1]), 7, 90);
  }

  if (/раз\s*(?:в|[/])?\s*недел/.test(normalized)) {
    return 7;
  }
  if (/раз\s*(?:в|[/])?\s*2\s*недел/.test(normalized)) {
    return 14;
  }
  if (/раз\s*(?:в|[/])?\s*месяц/.test(normalized)) {
    return 30;
  }
  if (/весн|лет/.test(normalized) && /осен|зим/.test(normalized)) {
    return 21;
  }
  if (/редк/.test(normalized)) {
    return 45;
  }

  return undefined;
}

export function deriveSeasonsFromEncyclopedia(
  encyclopedia: PlantEncyclopediaFields | undefined,
): Record<Season, SeasonCareIntervals> {
  const summerWater =
    parseWateringDaysFromText(encyclopedia?.watering) ?? DEFAULT_SUMMER.wateringDays;
  const summerFeed =
    parseFeedingDaysFromText(encyclopedia?.feeding) ?? DEFAULT_SUMMER.feedingDays;

  const dormancy = encyclopedia?.dormancy?.toLowerCase() ?? '';
  const winterWaterMultiplier =
    dormancy.includes('зим') || encyclopedia?.watering?.toLowerCase().includes('зим') ? 1.8 : 1.5;
  const winterFeedMultiplier = dormancy.includes('зим') ? 2.2 : 1.8;

  return {
    summer: {
      wateringDays: clampDays(summerWater, 2, 45),
      feedingDays: clampDays(summerFeed, 7, 60),
    },
    winter: {
      wateringDays: clampDays(summerWater * winterWaterMultiplier, 3, 60),
      feedingDays: clampDays(summerFeed * winterFeedMultiplier, 14, 90),
    },
  };
}
