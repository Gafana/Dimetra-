import type { CalendarEventStatus } from '../../api/types.js';
import {
  CALENDAR_STATUS_DOT_CLASS,
  CALENDAR_STATUS_LABEL,
} from '../../lib/calendarEventStatus.js';

export function CalendarEventStatusDot({
  status,
  size = 'sm',
  className = '',
}: {
  status: CalendarEventStatus;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const sizeClass =
    size === 'xs' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-3 w-3' : 'h-2 w-2';
  const label = CALENDAR_STATUS_LABEL[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={[
        'inline-block shrink-0 rounded-full ring-1 ring-black/20',
        sizeClass,
        CALENDAR_STATUS_DOT_CLASS[status],
        className,
      ].join(' ')}
    />
  );
}
