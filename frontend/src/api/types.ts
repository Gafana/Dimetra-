export interface RoomSummary {
  id: string;
  name: string;
}

export interface RoomWithPlants extends RoomSummary {
  plants: UserPlant[];
}

export type PlantCareAction = 'watering' | 'feeding';

export type PlantSeason = 'summer' | 'winter';

export interface CreatePlantPayload {
  custom_name: string;
  room_id?: string | null;
  catalog_id: string;
  last_repot_date?: string | null;
  current_season: PlantSeason;
}

export interface UserPlant {
  id: string;
  custom_name: string;
  room_id: string | null;
  catalog_id: string;
  last_repot_date: string | null;
  current_season: 'summer' | 'winter';
  next_watering_date: string | null;
  next_feeding_date: string | null;
  created_at: string;
}

export interface PlantCatalogEntry {
  id: string;
  name: string;
  seasons: Record<
    'summer' | 'winter',
    {
      wateringDays: number;
      feedingDays: number;
    }
  >;
}

export interface UserSettings {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
}
