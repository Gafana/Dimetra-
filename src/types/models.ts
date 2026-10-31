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

export interface CareHistoryRow {
  id: string;
  plant_id: string;
  action_type: CareActionType;
  done_at: string;
}

export interface RoomWithPlants extends RoomRow {
  plants: UserPlantRow[];
}

export interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
  timezone: string;
  last_notified_date: string | null;
}

export type CareActionType = 'watering' | 'feeding' | 'repot';

export type CalendarEventKind = 'scheduled' | 'completed';

export interface CalendarEvent {
  id: string;
  plant_id: string;
  plant_name: string;
  room_name: string | null;
  action_type: CareActionType;
  event_kind: CalendarEventKind;
  /** YYYY-MM-DD */
  date: string;
  /** ISO 8601, только для выполненных */
  done_at?: string;
}
