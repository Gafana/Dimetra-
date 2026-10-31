import { CALENDAR_STATUS_LEGEND } from '../../lib/calendarEventStatus.js';
import { CalendarEventStatusDot } from './CalendarEventStatusDot.js';

export function CalendarStatusLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-[10px] text-sage-300/90"
      aria-label="Обозначения статусов событий"
    >
      {CALENDAR_STATUS_LEGEND.map(({ status, label }) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <CalendarEventStatusDot status={status} size="sm" />
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
