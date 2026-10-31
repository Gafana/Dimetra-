import type { CalendarEvent } from '../../api/types.js';
import { careActionLabel, careActionTone } from '../../lib/careLabels.js';

const toneClasses: Record<'water' | 'feed' | 'repot', string> = {
  water: 'bg-sky-500/25 text-sky-100 border-sky-400/35',
  feed: 'bg-emerald-500/25 text-emerald-100 border-emerald-400/35',
  repot: 'bg-amber-500/25 text-amber-100 border-amber-400/35',
};

export function CalendarEventChip({
  event,
  compact = false,
}: {
  event: CalendarEvent;
  compact?: boolean;
}) {
  const tone = careActionTone(event.action_type);
  const completed = event.event_kind === 'completed';

  return (
    <div
      className={[
        'truncate rounded-md border px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight',
        toneClasses[tone],
        completed ? 'opacity-75' : '',
        compact ? 'max-w-full' : '',
      ].join(' ')}
      title={`${careActionLabel(event.action_type)} · ${event.plant_name}${event.room_name ? ` · ${event.room_name}` : ''}`}
    >
      {compact ? (
        <>
          <span className="opacity-90">{careActionLabel(event.action_type)}</span>
          <span className="mx-0.5 opacity-50">·</span>
          <span className="font-normal opacity-95">{event.plant_name}</span>
        </>
      ) : (
        <>
          <div>{careActionLabel(event.action_type)}</div>
          <div className="truncate font-normal opacity-90">{event.plant_name}</div>
        </>
      )}
    </div>
  );
}
