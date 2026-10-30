const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Текущая дата в формате YYYY-MM-DD (локальный календарный день). */
export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO-дата + N календарных дней. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  if (!ISO_DATE.test(isoDate)) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

/** Текущий момент в ISO 8601 (для care_history.done_at). */
export function nowIsoDateTime(): string {
  return new Date().toISOString();
}
