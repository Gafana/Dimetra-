import { addDaysToIsoDate } from './dates.js';
import type { CalendarEventKind, CalendarEventStatus } from '../types/models.js';

export const REPOT_INTERVAL_DAYS = 365;

export type PlantCareStatus = 'ok' | 'overdue';

export interface PlantScheduleInput {
  next_watering_date: string | null;
  next_feeding_date: string | null;
  last_repot_date: string | null;
}

export function nextRepotIsoDate(lastRepotDate: string | null): string | null {
  if (!lastRepotDate) {
    return null;
  }
  return addDaysToIsoDate(lastRepotDate, REPOT_INTERVAL_DAYS);
}

/** Даты запланированных задач (полив, подкормка, пересадка), как в календаре. */
export function scheduledCareDates(plant: PlantScheduleInput): string[] {
  const dates: string[] = [];
  if (plant.next_watering_date) {
    dates.push(plant.next_watering_date);
  }
  if (plant.next_feeding_date) {
    dates.push(plant.next_feeding_date);
  }
  const nextRepot = nextRepotIsoDate(plant.last_repot_date);
  if (nextRepot) {
    dates.push(nextRepot);
  }
  return dates;
}

export function isScheduledCareOverdue(date: string, todayIso: string): boolean {
  return date < todayIso;
}

export function plantHasOverdueCare(plant: PlantScheduleInput, todayIso: string): boolean {
  return scheduledCareDates(plant).some((date) => isScheduledCareOverdue(date, todayIso));
}

export function plantCareStatus(plant: PlantScheduleInput, todayIso: string): PlantCareStatus {
  return plantHasOverdueCare(plant, todayIso) ? 'overdue' : 'ok';
}

export function calendarEventStatus(
  eventKind: CalendarEventKind,
  date: string,
  todayIso: string,
): CalendarEventStatus {
  if (eventKind === 'completed') {
    return 'completed';
  }
  if (eventKind === 'overdue') {
    return 'overdue';
  }
  return isScheduledCareOverdue(date, todayIso) ? 'overdue' : 'scheduled';
}
