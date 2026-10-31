export const DEFAULT_USER_TIMEZONE = 'Europe/Moscow';

/** Проверка IANA timezone через Intl (Node 20+). */
export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) {
    return false;
  }
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

interface ZonedClock {
  /** YYYY-MM-DD в календаре пользователя */
  dateIso: string;
  /** HH:MM */
  hhmm: string;
  minutesSinceMidnight: number;
}

function zonedClock(timeZone: string, now: Date): ZonedClock {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00';

  const year = pick('year');
  const month = pick('month');
  const day = pick('day');
  let hour = Number(pick('hour'));
  if (hour === 24) {
    hour = 0;
  }
  const minute = Number(pick('minute'));

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');

  return {
    dateIso: `${year}-${month}-${day}`,
    hhmm: `${hh}:${mm}`,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/** Текущая дата YYYY-MM-DD в часовом поясе пользователя. */
export function todayIsoDateInTimeZone(timeZone: string, now = new Date()): string {
  const tz = isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_USER_TIMEZONE;
  return zonedClock(tz, now).dateIso;
}

export function parseNotificationTimeToMinutes(notificationTime: string): number {
  const [hours, minutes] = notificationTime.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Пора отправить ежедневное уведомление: локальное время >= notification_time
 * и сегодня ещё не отправляли (last_notified_date !== сегодня в TZ пользователя).
 */
export function isNotificationDue(
  notificationTime: string,
  timeZone: string,
  lastNotifiedDate: string | null,
  now = new Date(),
): boolean {
  const tz = isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_USER_TIMEZONE;
  const clock = zonedClock(tz, now);
  if (lastNotifiedDate === clock.dateIso) {
    return false;
  }
  const targetMinutes = parseNotificationTimeToMinutes(notificationTime);
  return clock.minutesSinceMidnight >= targetMinutes;
}
