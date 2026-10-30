/**
 * Локальное время сервера в формате HH:MM (календарные часы/минуты процесса Node.js).
 *
 * Часовой пояс: используется системная TZ процесса (переменная окружения TZ или OS).
 * `notification_time` в БД интерпретируется в том же поясе, что и сервер — для продакшена
 * задайте TZ (например Europe/Moscow) или вынесите offset пользователя в отдельное поле.
 */
export function currentLocalTimeHHMM(now = new Date()): string {
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Сравнение notification_time (HH:MM:SS) с текущими часами и минутами. */
export function notificationTimeMatchesNow(notificationTime: string, now = new Date()): boolean {
  const current = currentLocalTimeHHMM(now);
  const stored = notificationTime.slice(0, 5);
  return stored === current;
}
