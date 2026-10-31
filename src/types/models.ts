import type { Season } from '../db/catalog.js';

export interface RoomRow {
  id: string;
  name: string;
}

export interface UserPlantRow {
  id: string;
  custom_name: string;
  room_id: string | null;
  catalog_id: string;
  last_repot_date: string | null;
  current_season: Season;
  next_watering_date: string | null;
  next_feeding_date: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface UserPlantWithCareStatus extends UserPlantRow {
  care_status: PlantCareStatus;
}

export interface CareHistoryRow {
  id: string;
  plant_id: string;
  action_type: CareActionType;
  done_at: string;
}

export interface RoomWithPlants extends RoomRow {
  plants: UserPlantWithCareStatus[];
}

export interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
  timezone: string;
  last_notified_date: string | null;
}

export type CareActionType = 'watering' | 'feeding' | 'repot';

/** Сводка по просрочке запланированного ухода (для списка растений). */
export type PlantCareStatus = 'ok' | 'overdue';

export type CalendarEventKind = 'scheduled' | 'completed';

export type CalendarEventStatus = 'scheduled' | 'completed' | 'overdue';

export interface CalendarEvent {
  id: string;
  plant_id: string;
  plant_name: string;
  room_name: string | null;
  action_type: CareActionType;
  event_kind: CalendarEventKind;
  /** Запланировано / выполнено / просрочено (относительно «сегодня» в TZ пользователя) */
  status: CalendarEventStatus;
  /** YYYY-MM-DD */
  date: string;
  /** ISO 8601, только для выполненных */
  done_at?: string;
}
