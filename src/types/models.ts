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
  created_at: string;
}

export interface RoomWithPlants extends RoomRow {
  plants: UserPlantRow[];
}

export interface UserSettingsRow {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
}

export type CareActionType = 'watering' | 'feeding' | 'repot';
