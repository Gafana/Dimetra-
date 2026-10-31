import type { CalendarEvent } from '../../api/types.js';
import { groupEventsByDate, WEEKDAY_LABELS } from '../../lib/calendar.js';
import { todayIsoDate } from '../../lib/dates.js';
import { CalendarEventChip } from './CalendarEventChip.js';

const MAX_VISIBLE = 3;

export function CalendarMonthView({
  weeks,
  anchorIso,
  events,
  selectedDate,
  onSelectDate,
}: {
  weeks: string[][];
  anchorIso: string;
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}) {
  const byDate = groupEventsByDate(events);
  const today = todayIsoDate();
  const anchorMonth = anchorIso.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-sage-400/80"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-white/5">
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-7 divide-x divide-white/5">
            {week.map((dayIso) => {
              const inMonth = dayIso.startsWith(anchorMonth);
              const isToday = dayIso === today;
              const isSelected = dayIso === selectedDate;
              const dayEvents = byDate.get(dayIso) ?? [];
              const visible = dayEvents.slice(0, MAX_VISIBLE);
              const hidden = dayEvents.length - visible.length;

              return (
                <button
                  key={dayIso}
                  type="button"
                  onClick={() => onSelectDate(dayIso)}
                  className={[
                    'flex min-h-[5.25rem] flex-col p-1 text-left transition-colors sm:min-h-[6.5rem]',
                    inMonth ? 'text-sage-100' : 'text-sage-500/50',
                    isSelected ? 'bg-sage-400/15 ring-1 ring-inset ring-sage-300/30' : 'hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                      isToday ? 'bg-sage-400 text-forest-900' : '',
                    ].join(' ')}
                  >
                    {Number(dayIso.slice(8, 10))}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {visible.map((event) => (
                      <CalendarEventChip key={event.id} event={event} compact />
                    ))}
                    {hidden > 0 ? (
                      <span className="px-0.5 text-[9px] font-medium text-sage-400/90">+{hidden}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
