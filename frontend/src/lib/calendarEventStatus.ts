import type { CalendarEventStatus } from '../api/types.js';

export const CALENDAR_STATUS_LABEL: Record<CalendarEventStatus, string> = {
  scheduled: 'Запланировано',
  completed: 'Выполнено',
  overdue: 'Просрочено',
};

/** Tailwind classes for the status dot (background). */
export const CALENDAR_STATUS_DOT_CLASS: Record<CalendarEventStatus, string> = {
  scheduled: 'bg-amber-400',
  completed: 'bg-emerald-400',
  overdue: 'bg-red-500',
};

export const CALENDAR_STATUS_LEGEND: { status: CalendarEventStatus; label: string }[] = [
  { status: 'scheduled', label: CALENDAR_STATUS_LABEL.scheduled },
  { status: 'completed', label: CALENDAR_STATUS_LABEL.completed },
  { status: 'overdue', label: CALENDAR_STATUS_LABEL.overdue },
];
