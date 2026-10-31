import type { CalendarEvent } from '../../api/types.js';
import { groupEventsByDate, WEEKDAY_LABELS } from '../../lib/calendar.js';
import { formatDisplayDate, todayIsoDate } from '../../lib/dates.js';
import { CalendarEventChip } from './CalendarEventChip.js';

export function CalendarWeekView({
  days,
  events,
  selectedDate,
  onSelectDate,
}: {
  days: string[];
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}) {
  const byDate = groupEventsByDate(events);
  const today = todayIsoDate();

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((dayIso, index) => {
        const isToday = dayIso === today;
        const isSelected = dayIso === selectedDate;
        const dayEvents = byDate.get(dayIso) ?? [];

        return (
          <button
            key={dayIso}
            type="button"
            onClick={() => onSelectDate(dayIso)}
            className={[
              'flex min-h-[12rem] flex-col rounded-2xl border p-1.5 text-left transition-colors sm:min-h-[14rem] sm:p-2',
              isSelected
                ? 'border-sage-300/35 bg-sage-400/10'
                : 'border-white/10 bg-black/10 hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <div className="mb-2 border-b border-white/5 pb-2 text-center">
              <div className="text-[10px] font-semibold uppercase text-sage-400/80">
                {WEEKDAY_LABELS[index]}
              </div>
              <div
                className={[
                  'mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  isToday ? 'bg-sage-400 text-forest-900' : 'text-sage-100',
                ].join(' ')}
              >
                {Number(dayIso.slice(8, 10))}
              </div>
              <div className="mt-0.5 text-[9px] text-sage-400/70">{formatDisplayDate(dayIso)}</div>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
              {dayEvents.length === 0 ? (
                <span className="px-0.5 text-[9px] text-sage-500/60">—</span>
              ) : (
                dayEvents.map((event) => <CalendarEventChip key={event.id} event={event} />)
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
