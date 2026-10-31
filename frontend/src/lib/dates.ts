export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) {
    return '—';
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isCareDue(nextDate: string | null, today = todayIsoDate()): boolean {
  if (!nextDate) {
    return false;
  }
  return nextDate <= today;
}

/** HH:MM:SS → значение для input[type=time] (HH:MM). */
export function notificationTimeToInputValue(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

/** input HH:MM → HH:MM:00 для API. */
export function inputValueToNotificationTime(value: string): string {
  const [hours, minutes] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
}
