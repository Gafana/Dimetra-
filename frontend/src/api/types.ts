export interface RoomSummary {
  id: string;
  name: string;
}

export interface RoomWithPlants extends RoomSummary {
  plants: UserPlant[];
}

export type PlantCareAction = 'watering' | 'feeding';

export type CareActionType = PlantCareAction | 'repot';

export type CalendarEventKind = 'scheduled' | 'completed';

export interface CalendarEvent {
  id: string;
  plant_id: string;
  plant_name: string;
  room_name: string | null;
  action_type: CareActionType;
  event_kind: CalendarEventKind;
  date: string;
  done_at?: string;
}

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
  photo_url: string | null;
  created_at: string;
}

export interface CareHistoryEntry {
  id: string;
  plant_id: string;
  action_type: CareActionType;
  done_at: string;
}

export interface PlantEncyclopediaFields {
  family?: string;
  origin?: string;
  flowering?: string;
  growth?: string;
  light?: string;
  temperature?: string;
  watering?: string;
  humidity?: string;
  feeding?: string;
  dormancy?: string;
  repotting?: string;
  propagation?: string;
}

export type LightRequirementLevel = 'window_moscow_ok' | 'bright_window' | 'grow_lamp';

export interface PlantCatalogPickerEntry {
  id: string;
  name: string;
  nameLatin?: string;
  imageUrl: string;
  seasons: Record<
    'summer' | 'winter',
    {
      wateringDays: number;
      feedingDays: number;
    }
  >;
}

export interface PlantCatalogEntry {
  id: string;
  name: string;
  nameLatin?: string;
  sourceUrl?: string;
  imageUrl: string;
  description?: string;
  wateringNotes?: string;
  feedingProduct?: string;
  feedingNotes?: string;
  lightLevel: LightRequirementLevel;
  lightNotes?: string;
  encyclopedia?: PlantEncyclopediaFields;
  seasons: Record<
    'summer' | 'winter',
    {
      wateringDays: number;
      feedingDays: number;
    }
  >;
  updatedAt?: string;
}

export type UpsertPlantCatalogPayload = {
  id?: string;
  name: string;
  nameLatin?: string | null;
  imageUrl: string;
  description?: string | null;
  wateringNotes?: string | null;
  feedingProduct?: string | null;
  feedingNotes?: string | null;
  lightLevel: LightRequirementLevel;
  lightNotes?: string | null;
  seasons: PlantCatalogEntry['seasons'];
  sourceUrl?: string | null;
};

export interface UserSettings {
  id: string;
  telegram_chat_id: string;
  notification_time: string;
}
