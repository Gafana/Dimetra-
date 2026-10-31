import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MIN_PEPPER_LENGTH = 16;
export const MAX_PROMO_ACTIVATIONS = 1000;
const MAX_TTL_MS = 3660 * 24 * 60 * 60 * 1000;
const DEFAULT_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_INVITE_IDS = 20;

export const PROMO_COMMAND_HELP = [
  'Создание промокода:',
  '/promo <лимит> <срок>',
  '',
  `Лимит — число активаций от 1 до ${MAX_PROMO_ACTIVATIONS}.`,
  'Срок — 12h, 30d или дата ГГГГ-ММ-ДД (до конца этого дня).',
  '',
  'Пример: /promo 5 30d',
  '',
  'Одноразовые коды друзьям (лимит 1), каждому в личку:',
  '/promo invite <telegram_id> [telegram_id...]',
  '/promo invite 14d <telegram_id> [telegram_id...]',
  '',
  'Без срока код для друга действует 30 дней.',
  'Код не уходит тем, у кого уже есть комнаты или растения.',
  'В базе хранится только хеш. Не вставляйте код в ссылку.',
].join('\n');

export type PromoCommandResult =
  | { ok: true; action: 'help' }
  | { ok: true; action: 'create'; maxActivations: number; expiresAt: Date }
  | { ok: true; action: 'invite'; telegramIds: string[]; expiresAt: Date }
  | { ok: false; message: string };

export function readPromoPepper(): string | null {
  const pepper = process.env.PROMO_CODE_PEPPER?.trim() ?? '';
  if (pepper.length < MIN_PEPPER_LENGTH) {
    return null;
  }
  return pepper;
}

export function listPromoAdminIds(): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of (process.env.PROMO_ADMIN_IDS ?? '').split(/[,\s]+/)) {
    const id = part.trim();
    if (!isTelegramUserId(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function isPromoAdmin(telegramId: string): boolean {
  return listPromoAdminIds().includes(telegramId);
}

export function isTelegramUserId(value: string): boolean {
  return /^\d{5,16}$/.test(value) && Number.isSafeInteger(Number(value));
}

export function normalizePromoCode(text: string): string {
  return text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isExactPromoCode(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(trimmed) ||
    /^[A-Za-z0-9]{12}$/.test(trimmed) ||
    /^[A-Za-z0-9]{4}\s+[A-Za-z0-9]{4}\s+[A-Za-z0-9]{4}$/.test(trimmed)
  );
}

export function messageCarriesPromoCode(text: string): boolean {
  return (
    /[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}/.test(text) ||
    /(?:^|\s)[A-Za-z0-9]{12}(?:\s|$)/.test(text)
  );
}

export function hashPromoCode(plain: string, pepper: string): string {
  return crypto.createHmac('sha256', pepper).update(normalizePromoCode(plain)).digest('hex');
}

export function generatePromoCode(): string {
  const bytes = crypto.randomBytes(12);
  let raw = '';
  for (let index = 0; index < 12; index += 1) {
    raw += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function resolvePromoTimeZone(): string {
  const configured = process.env.TZ?.trim();
  if (!configured) {
    return 'Europe/Moscow';
  }
  try {
    Intl.DateTimeFormat('ru-RU', { timeZone: configured });
    return configured;
  } catch {
    return 'Europe/Moscow';
  }
}

export function formatPromoExpiry(date: Date, timeZone = resolvePromoTimeZone()): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export function commandArgs(text: string): string[] {
  return text.trim().split(/\s+/).slice(1);
}

/** True when /start carries a payload. The payload is not captured: codes must not arrive via t.me links. */
export function hasStartPayload(text: string | undefined): boolean {
  if (!text) {
    return false;
  }
  return /^\/start(?:@\w+)?\s+\S+/i.test(text.trim());
}

export function parsePromoCommand(
  args: string[],
  now = new Date(),
  timeZone = resolvePromoTimeZone(),
): PromoCommandResult {
  if (args.length === 0 || (args.length === 1 && args[0] === 'help')) {
    return { ok: true, action: 'help' };
  }

  if (args[0] === 'invite') {
    return parseInviteArgs(args.slice(1), now, timeZone);
  }

  if (args.length !== 2) {
    return { ok: false, message: 'Нужны лимит и срок. Пример: /promo 5 30d' };
  }

  const maxActivations = parseActivationLimit(args[0] ?? '');
  if (maxActivations === null) {
    return {
      ok: false,
      message: `Лимит активаций — целое число от 1 до ${MAX_PROMO_ACTIVATIONS}.`,
    };
  }

  const expiresAt = parsePromoExpiry(args[1] ?? '', now, timeZone);
  if (!expiresAt) {
    return {
      ok: false,
      message: 'Срок: 12h, 30d или дата ГГГГ-ММ-ДД в будущем (не дальше 10 лет).',
    };
  }

  return { ok: true, action: 'create', maxActivations, expiresAt };
}

export function parsePromoExpiry(token: string, now: Date, timeZone: string): Date | null {
  return parseDuration(token, now) ?? parseCalendarDate(token, now, timeZone);
}

function parseInviteArgs(args: string[], now: Date, timeZone: string): PromoCommandResult {
  if (args.length === 0) {
    return { ok: false, message: 'Укажите Telegram ID. Пример: /promo invite 123456789' };
  }

  let expiresAt = new Date(now.getTime() + DEFAULT_INVITE_TTL_MS);
  let idTokens = args;

  if (!isTelegramUserId(args[0] ?? '')) {
    if (args.length === 1) {
      return { ok: false, message: 'Укажите Telegram ID. Пример: /promo invite 14d 123456789' };
    }
    const parsedExpiry = parsePromoExpiry(args[0] ?? '', now, timeZone);
    if (!parsedExpiry) {
      return {
        ok: false,
        message: 'Срок приглашения: 14d, 12h или дата ГГГГ-ММ-ДД в будущем.',
      };
    }
    expiresAt = parsedExpiry;
    idTokens = args.slice(1);
  }

  if (idTokens.length > MAX_INVITE_IDS) {
    return { ok: false, message: `За один раз можно отправить не больше ${MAX_INVITE_IDS} кодов.` };
  }

  const telegramIds: string[] = [];
  const seen = new Set<string>();
  for (const token of idTokens) {
    if (!isTelegramUserId(token)) {
      return { ok: false, message: 'Каждый Telegram ID должен состоять из 5–16 цифр.' };
    }
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    telegramIds.push(token);
  }

  if (telegramIds.length === 0) {
    return { ok: false, message: 'Укажите хотя бы один Telegram ID.' };
  }

  return { ok: true, action: 'invite', telegramIds, expiresAt };
}

function parseActivationLimit(token: string): number | null {
  if (!/^\d{1,4}$/.test(token)) {
    return null;
  }
  const value = Number(token);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PROMO_ACTIVATIONS) {
    return null;
  }
  return value;
}

function parseDuration(token: string, now: Date): Date | null {
  const match = /^(\d{1,5})([dh])$/i.exec(token);
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  if (!Number.isInteger(amount) || amount < 1) {
    return null;
  }
  const unit = match[2]!.toLowerCase();
  const ttl = unit === 'd' ? amount * 24 * 60 * 60 * 1000 : amount * 60 * 60 * 1000;
  if (ttl > MAX_TTL_MS) {
    return null;
  }
  return new Date(now.getTime() + ttl);
}

function parseCalendarDate(token: string, now: Date, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  const expiresAt = zonedDateTimeToUtc(year, month, day, 23, 59, 59, timeZone);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    return null;
  }
  if (expiresAt.getTime() - now.getTime() > MAX_TTL_MS) {
    return null;
  }
  return expiresAt;
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const bag: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      bag[part.type] = part.value;
    }
  }

  const hour = Number(bag.hour) % 24;
  const asUtc = Date.UTC(
    Number(bag.year),
    Number(bag.month) - 1,
    Number(bag.day),
    hour,
    Number(bag.minute),
    Number(bag.second),
  );
  return asUtc - instant.getTime();
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset1 = getTimeZoneOffsetMs(utcGuess, timeZone);
  const corrected = new Date(utcGuess.getTime() - offset1);
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  return new Date(utcGuess.getTime() - offset2);
}
