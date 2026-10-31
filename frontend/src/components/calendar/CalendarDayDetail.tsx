import type { CalendarEvent } from '../../api/types.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { careActionLabel, careEventTitle } from '../../lib/careLabels.js';
import { CALENDAR_STATUS_LABEL } from '../../lib/calendarEventStatus.js';
import { GlassPanel } from '../ui/GlassPanel.js';
import { CalendarEventStatusDot } from './CalendarEventStatusDot.js';

export function CalendarDayDetail({
  date,
  events,
}: {
  date: string;
  events: CalendarEvent[];
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="font-serif text-lg text-sage-100">{formatDisplayDate(date)}</h3>
      <p className="mt-0.5 text-xs text-sage-400/90">
        {events.length === 0
          ? 'Нет событий ухода'
          : `${events.length} ${events.length === 1 ? 'событие' : events.length < 5 ? 'события' : 'событий'}`}
      </p>

      {events.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-sage-100">
                  <CalendarEventStatusDot status={event.status} size="md" />
                  <span>{careEventTitle(event.action_type, event.event_kind)}</span>
                </p>
                <p className="truncate text-sage-300/90">{event.plant_name}</p>
                {event.room_name ? (
                  <p className="text-xs text-sage-400/80">{event.room_name}</p>
                ) : null}
              </div>
              <span
                className={[
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  event.event_kind === 'scheduled'
                    ? 'bg-sage-400/15 text-sage-200'
                    : 'bg-white/8 text-sage-400',
                ].join(' ')}
                title={CALENDAR_STATUS_LABEL[event.status]}
              >
                {CALENDAR_STATUS_LABEL[event.status]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-[10px] leading-snug text-sage-500/80">
        План: ближайшие полив и подкормка; пересадка — через год после последней. История — из журнала
        ухода ({careActionLabel('watering').toLowerCase()}, {careActionLabel('feeding').toLowerCase()},{' '}
        {careActionLabel('repot').toLowerCase()}).
      </p>
    </GlassPanel>
  );
}
