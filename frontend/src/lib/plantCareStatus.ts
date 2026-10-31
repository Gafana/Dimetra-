import type { PlantCareStatus } from '../api/types.js';
import { CALENDAR_STATUS_DOT_CLASS } from './calendarEventStatus.js';

export const PLANT_CARE_STATUS_LABEL: Record<PlantCareStatus, string> = {
  ok: 'Нет просроченных задач',
  overdue: 'Есть просроченные задачи',
};

export const PLANT_CARE_STATUS_DOT_CLASS: Record<PlantCareStatus, string> = {
  ok: CALENDAR_STATUS_DOT_CLASS.completed,
  overdue: CALENDAR_STATUS_DOT_CLASS.overdue,
};
