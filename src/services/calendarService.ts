import { addDaysToIsoDate } from '../lib/dates.js';
import { query } from '../db/pool.js';
import type { CalendarEvent, CareActionType } from '../types/models.js';

const REPOT_INTERVAL_DAYS = 365;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

interface PlantCalendarRow {
  id: string;
  custom_name: string;
  room_name: string | null;
  next_watering_date: string | null;
  next_feeding_date: string | null;
  last_repot_date: string | null;
}

interface HistoryCalendarRow {
  id: string;
  plant_id: string;
  plant_name: string;
  room_name: string | null;
  action_type: CareActionType;
  done_at: string;
}

function historyDateFromDoneAt(doneAt: string): string {
  return doneAt.slice(0, 10);
}

function pushScheduled(
  events: CalendarEvent[],
  plant: PlantCalendarRow,
  actionType: CareActionType,
  date: string | null,
  from: string,
  to: string,
): void {
  if (!date || !isDateInRange(date, from, to)) {
    return;
  }
  events.push({
    id: `scheduled:${plant.id}:${actionType}:${date}`,
    plant_id: plant.id,
    plant_name: plant.custom_name,
    room_name: plant.room_name,
    action_type: actionType,
    event_kind: 'scheduled',
    date,
  });
}

export async function listCalendarEvents(
  telegramChatId: string,
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) {
    throw new Error('Invalid calendar range');
  }

  const plants = await query<PlantCalendarRow>(
    `SELECT up.id, up.custom_name, up.next_watering_date, up.next_feeding_date, up.last_repot_date,
            r.name AS room_name
     FROM user_plants up
     LEFT JOIN rooms r ON r.id = up.room_id
     WHERE up.telegram_chat_id = $1`,
    [telegramChatId],
  );

  const events: CalendarEvent[] = [];

  for (const plant of plants) {
    pushScheduled(events, plant, 'watering', plant.next_watering_date, from, to);
    pushScheduled(events, plant, 'feeding', plant.next_feeding_date, from, to);

    if (plant.last_repot_date) {
      const nextRepot = addDaysToIsoDate(plant.last_repot_date, REPOT_INTERVAL_DAYS);
      pushScheduled(events, plant, 'repot', nextRepot, from, to);
    }
  }

  const history = await query<HistoryCalendarRow>(
    `SELECT ch.id, ch.plant_id, ch.action_type, ch.done_at,
            up.custom_name AS plant_name, r.name AS room_name
     FROM care_history ch
     INNER JOIN user_plants up ON up.id = ch.plant_id
     LEFT JOIN rooms r ON r.id = up.room_id
     WHERE up.telegram_chat_id = $1
       AND ch.done_at::date >= $2::date
       AND ch.done_at::date <= $3::date`,
    [telegramChatId, from, to],
  );

  for (const row of history) {
    events.push({
      id: row.id,
      plant_id: row.plant_id,
      plant_name: row.plant_name,
      room_name: row.room_name,
      action_type: row.action_type,
      event_kind: 'completed',
      date: historyDateFromDoneAt(row.done_at),
      done_at: row.done_at,
    });
  }

  events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.event_kind !== b.event_kind) {
      return a.event_kind === 'scheduled' ? -1 : 1;
    }
    return a.plant_name.localeCompare(b.plant_name, 'ru');
  });

  return events;
}
