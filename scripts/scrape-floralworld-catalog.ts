/**
 * Импорт энциклопедии FloralWorld (комнатные растения).
 * Источник: https://floralworld.ru/encyclopedia/catalogue.html
 *
 * Запуск: npx tsx scripts/scrape-floralworld-catalog.ts [--limit N] [--delay MS]
 */
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { deriveSeasonsFromEncyclopedia } from '../src/lib/deriveCareIntervals.js';
import { inferLightLevelFromText } from '../src/lib/inferLightLevel.js';
import type { PlantCatalogEntry, PlantCatalogFile, PlantEncyclopediaFields } from '../src/db/catalogTypes.js';

const BASE = 'https://floralworld.ru';
const CATALOGUE_URL = `${BASE}/encyclopedia/catalogue.html`;
const USER_AGENT = 'DimetraPlantCatalog/1.0 (+local dev; respectful scrape)';

const LABEL_MAP: Record<string, keyof PlantEncyclopediaFields> = {
  семейство: 'family',
  родина: 'origin',
  цветение: 'flowering',
  рост: 'growth',
  свет: 'light',
  температура: 'temperature',
  полив: 'watering',
  'влажность воздуха': 'humidity',
  подкормка: 'feeding',
  'период покоя': 'dormancy',
  пересадка: 'repotting',
  размножение: 'propagation',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): { limit: number | null; delayMs: number } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let delayMs = 350;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--delay' && args[i + 1]) {
      delayMs = Number(args[i + 1]);
      i++;
    }
  }

  return { limit, delayMs };
}

function slugToId(slug: string): string {
  return slug
    .replace(/\.(html|shtml)$/i, '')
    .replace(/_/g, '-')
    .toLowerCase();
}

function resolveUrl(href: string, basePath: string): string {
  if (href.startsWith('http')) {
    return href.split('#')[0]!;
  }
  const clean = href.split('#')[0]!;
  if (clean.startsWith('/')) {
    return `${BASE}${clean}`;
  }
  return `${BASE}${basePath}${clean}`;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function normalizeLabel(raw: string): string {
  return raw
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/:$/, '');
}

function parseCharacteristics($: cheerio.CheerioAPI): PlantEncyclopediaFields {
  const fields: PlantEncyclopediaFields = {};
  $('#characterstic p, #characteristic p').each((_, el) => {
    const strong = $(el).find('strong').first();
    if (!strong.length) {
      return;
    }
    const label = normalizeLabel(strong.text());
    const key = LABEL_MAP[label];
    if (!key) {
      return;
    }
    const clone = $(el).clone();
    clone.find('strong').remove();
    const value = clone.text().replace(/\s+/g, ' ').trim();
    if (value) {
      fields[key] = value;
    }
  });
  return fields;
}

function parseNames($: cheerio.CheerioAPI): { name: string; nameLatin?: string } {
  const h1 = $('td.content_plant h1, td.content h1').first().text().replace(/\s+/g, ' ').trim();
  if (!h1) {
    return { name: 'Без названия' };
  }
  const parts = h1.split('—').map((p) => p.trim());
  if (parts.length >= 2) {
    return { name: parts[0]!, nameLatin: parts.slice(1).join(' — ') };
  }
  return { name: h1 };
}

function parseDescription($: cheerio.CheerioAPI): string | undefined {
  const chunks: string[] = [];
  $('div.history p').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 40) {
      chunks.push(text);
    }
  });
  const joined = chunks.join('\n\n').trim();
  if (!joined) {
    return undefined;
  }
  return joined.length > 4000 ? `${joined.slice(0, 3997)}…` : joined;
}

function parseImage($: cheerio.CheerioAPI): string | undefined {
  const img = $('td.content_plant img, td.content img').first();
  const src = img.attr('src');
  if (!src) {
    return undefined;
  }
  if (src.startsWith('http')) {
    return src;
  }
  return new URL(src.replace(/^\.\.\//, '/'), `${BASE}/`).href;
}

function collectPaginationUrls($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const urls = new Set<string>([pageUrl]);
  $('span.sig14 a[href*="plants/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) {
      return;
    }
    urls.add(resolveUrl(href, '/encyclopedia/'));
  });
  return [...urls];
}

async function scrapePlantPage(listingUrl: string, linkText: string): Promise<PlantCatalogEntry | null> {
  const firstHtml = await fetchHtml(listingUrl);
  const $first = cheerio.load(firstHtml);
  const pageUrls = collectPaginationUrls($first, listingUrl);

  let encyclopedia: PlantEncyclopediaFields = {};
  const descriptions: string[] = [];
  let names = parseNames($first);
  let imageUrl = parseImage($first);

  for (const pageUrl of pageUrls) {
    const html = pageUrl === listingUrl ? firstHtml : await fetchHtml(pageUrl);
    const $ = cheerio.load(html);
    encyclopedia = { ...encyclopedia, ...parseCharacteristics($) };
    const desc = parseDescription($);
    if (desc) {
      descriptions.push(desc);
    }
    if (!imageUrl) {
      imageUrl = parseImage($);
    }
    const pageNames = parseNames($);
    if (pageNames.name !== 'Без названия') {
      names = pageNames;
    }
  }

  const pathMatch = listingUrl.match(/\/plants\/([^/?#]+)/i);
  if (!pathMatch) {
    return null;
  }

  const slug = pathMatch[1]!;
  const id = slugToId(slug);

  if (!names.name || names.name === 'Без названия') {
    const fromLink = linkText.split('—').map((p) => p.trim());
    names = { name: fromLink[0] ?? slug, nameLatin: fromLink[1] };
  }

  const description = descriptions.length ? descriptions.join('\n\n') : undefined;

  const imageUrlResolved = imageUrl ?? '';
  return {
    id,
    name: names.name,
    nameLatin: names.nameLatin,
    sourceUrl: listingUrl,
    imageUrl: imageUrlResolved,
    description,
    encyclopedia: Object.keys(encyclopedia).length ? encyclopedia : undefined,
    seasons: deriveSeasonsFromEncyclopedia(encyclopedia),
    lightLevel: inferLightLevelFromText(encyclopedia.light),
    lightNotes: encyclopedia.light,
    wateringNotes: encyclopedia.watering,
    feedingNotes: encyclopedia.feeding,
    feedingProduct: encyclopedia.feeding?.split(/[.;]/)[0]?.trim(),
  };
}

async function collectCatalogLinks(): Promise<Array<{ url: string; text: string }>> {
  const html = await fetchHtml(CATALOGUE_URL);
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const links: Array<{ url: string; text: string }> = [];

  $('table#genus a[href*="plants/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.includes('#')) {
      return;
    }
    if (/_\d+\.(html|shtml)$/i.test(href)) {
      return;
    }
    const url = resolveUrl(href, '/encyclopedia/');
    if (seen.has(url)) {
      return;
    }
    seen.add(url);
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) {
      links.push({ url, text });
    }
  });

  links.sort((a, b) => a.text.localeCompare(b.text, 'ru'));
  return links;
}

async function main(): Promise<void> {
  const { limit, delayMs } = parseArgs();
  console.log('Fetching catalogue index…');
  const links = await collectCatalogLinks();
  const slice = limit ? links.slice(0, limit) : links;
  console.log(`Found ${links.length} plants; scraping ${slice.length}…`);

  const plants: PlantCatalogEntry[] = [];
  const errors: string[] = [];

  for (let i = 0; i < slice.length; i++) {
    const { url, text } = slice[i]!;
    process.stdout.write(`[${i + 1}/${slice.length}] ${text}… `);
    try {
      const entry = await scrapePlantPage(url, text);
      if (entry) {
        plants.push(entry);
        console.log('ok');
      } else {
        console.log('skip');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${url}: ${message}`);
      console.log(`err (${message})`);
    }
    if (i < slice.length - 1) {
      await sleep(delayMs);
    }
  }

  const outPath = path.join(process.cwd(), 'data', 'plant-catalog.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const payload: PlantCatalogFile = {
    version: 1,
    source: 'https://floralworld.ru/encyclopedia/catalogue.html',
    scrapedAt: new Date().toISOString(),
    plants,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${plants.length} plants → ${outPath}`);
  if (errors.length) {
    console.log(`Errors: ${errors.length} (see data/scrape-errors.log)`);
    fs.writeFileSync(
      path.join(process.cwd(), 'data', 'scrape-errors.log'),
      `${errors.join('\n')}\n`,
      'utf8',
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
