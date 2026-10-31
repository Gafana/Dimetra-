export type CalendarViewMode = 'month' | 'week';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addCalendarDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function startOfWeekMonday(iso: string): string {
  const date = parseIsoDate(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function getWeekDays(weekStartMonday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addCalendarDays(weekStartMonday, i));
}

export function buildMonthGrid(anchorIso: string): { weeks: string[][]; from: string; to: string } {
  if (!ISO_DATE.test(anchorIso)) {
    throw new Error('Invalid anchor date');
  }
  const anchor = parseIsoDate(anchorIso);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstIso = toIsoDate(new Date(year, month, 1));
  const lastIso = toIsoDate(new Date(year, month + 1, 0));

  const weeks: string[][] = [];
  let cursor = startOfWeekMonday(firstIso);

  while (weeks.length === 0 || weeks[weeks.length - 1]![6]! < lastIso) {
    weeks.push(getWeekDays(cursor));
    cursor = addCalendarDays(cursor, 7);
    if (weeks.length > 6) {
      break;
    }
  }

  const from = weeks[0]![0]!;
  const to = weeks[weeks.length - 1]![6]!;
  return { weeks, from, to };
}

export function getWeekRange(anchorIso: string): { days: string[]; from: string; to: string } {
  const from = startOfWeekMonday(anchorIso);
  const days = getWeekDays(from);
  return { days, from, to: days[6]! };
}

export function shiftAnchor(anchorIso: string, mode: CalendarViewMode, delta: number): string {
  const date = parseIsoDate(anchorIso);
  if (mode === 'month') {
    date.setMonth(date.getMonth() + delta);
    return toIsoDate(date);
  }
  return addCalendarDays(anchorIso, delta * 7);
}

export function formatMonthTitle(anchorIso: string): string {
  const date = parseIsoDate(anchorIso);
  const label = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatWeekTitle(weekStart: string): string {
  const start = parseIsoDate(weekStart);
  const end = parseIsoDate(addCalendarDays(weekStart, 6));
  const sameMonth = start.getMonth() === end.getMonth();
  const startPart = start.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: sameMonth ? undefined : 'short',
  });
  const endPart = end.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })} – ${endPart}`;
  }
  return `${startPart} – ${endPart}`;
}

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export function groupEventsByDate<T extends { date: string }>(events: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}
