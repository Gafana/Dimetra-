import { apiClient } from './client.js';
import type {
  CalendarEvent,
  CareHistoryEntry,
  CreatePlantPayload,
  UpdatePlantPayload,
  PlantCatalogEntry,
  PlantCatalogPickerEntry,
  PlantCareAction,
  RoomSummary,
  RoomWithPlants,
  UserPlant,
  UpsertPlantCatalogPayload,
  UserSettings,
  AccessStatus,
} from './types.js';

export async function fetchCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>('/api/calendar', {
    params: { from, to },
  });
  return data;
}

export async function fetchRooms(): Promise<RoomWithPlants[]> {
  const { data } = await apiClient.get<RoomWithPlants[]>('/api/rooms');
  return data;
}

export async function createRoom(name: string): Promise<RoomSummary> {
  const { data } = await apiClient.post<RoomSummary>('/api/rooms', { name });
  return data;
}

export async function updateRoom(roomId: string, name: string): Promise<RoomSummary> {
  const { data } = await apiClient.put<RoomSummary>(`/api/rooms/${roomId}`, { name });
  return data;
}

export async function deleteRoom(roomId: string): Promise<void> {
  await apiClient.delete(`/api/rooms/${roomId}`);
}

export async function fetchEncyclopedia(query?: string): Promise<PlantCatalogEntry[]> {
  const q = query?.trim();
  const { data } = await apiClient.get<PlantCatalogEntry[]>('/api/encyclopedia', {
    params: q ? { q } : undefined,
  });
  return data;
}

export async function fetchEncyclopediaPlant(id: string): Promise<PlantCatalogEntry> {
  const { data } = await apiClient.get<PlantCatalogEntry>(`/api/encyclopedia/${id}`);
  return data;
}

export async function createEncyclopediaPlant(
  payload: UpsertPlantCatalogPayload,
): Promise<PlantCatalogEntry> {
  const { data } = await apiClient.post<PlantCatalogEntry>('/api/encyclopedia', payload);
  return data;
}

export async function updateEncyclopediaPlant(
  id: string,
  payload: UpsertPlantCatalogPayload,
): Promise<PlantCatalogEntry> {
  const { data } = await apiClient.put<PlantCatalogEntry>(`/api/encyclopedia/${id}`, payload);
  return data;
}

export async function deleteEncyclopediaPlant(id: string): Promise<void> {
  await apiClient.delete(`/api/encyclopedia/${id}`);
}

export async function fetchCatalogPicker(): Promise<PlantCatalogPickerEntry[]> {
  const { data } = await apiClient.get<PlantCatalogPickerEntry[]>('/api/catalog/picker');
  return data;
}

export async function fetchCatalog(query?: string): Promise<PlantCatalogEntry[]> {
  const q = query?.trim();
  const { data } = await apiClient.get<PlantCatalogEntry[]>('/api/catalog', {
    params: q ? { q } : undefined,
  });
  return data;
}

export async function createPlant(payload: CreatePlantPayload): Promise<UserPlant> {
  const { data } = await apiClient.post<UserPlant>('/api/plants', payload);
  return data;
}

export async function performPlantAction(
  plantId: string,
  actionType: PlantCareAction,
): Promise<UserPlant> {
  const { data } = await apiClient.post<UserPlant>(`/api/plants/${plantId}/action`, {
    action_type: actionType,
  });
  return data;
}

export async function repotPlant(plantId: string): Promise<UserPlant> {
  const { data } = await apiClient.post<UserPlant>(`/api/plants/${plantId}/repot`);
  return data;
}

export async function updatePlant(
  plantId: string,
  payload: UpdatePlantPayload,
): Promise<UserPlant> {
  const { data } = await apiClient.patch<UserPlant>(`/api/plants/${plantId}`, payload);
  return data;
}

export async function deletePlant(plantId: string): Promise<void> {
  await apiClient.delete(`/api/plants/${plantId}`);
}

export async function updatePlantSchedule(
  plantId: string,
  patch: { next_watering_date?: string | null; next_feeding_date?: string | null },
): Promise<UserPlant> {
  const { data } = await apiClient.patch<UserPlant>(`/api/plants/${plantId}/schedule`, patch);
  return data;
}

export async function updatePlantPhoto(
  plantId: string,
  photoUrl: string | null,
): Promise<UserPlant> {
  const { data } = await apiClient.patch<UserPlant>(`/api/plants/${plantId}/photo`, {
    photo_url: photoUrl,
  });
  return data;
}

export async function fetchPlantCareHistory(plantId: string): Promise<CareHistoryEntry[]> {
  const { data } = await apiClient.get<CareHistoryEntry[]>(`/api/plants/${plantId}/history`);
  return data;
}

export async function fetchAccessStatus(): Promise<AccessStatus> {
  const { data } = await apiClient.get<AccessStatus>('/api/access');
  return data;
}

export async function fetchSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get<UserSettings>('/api/settings');
  return data;
}

export async function updateSettings(patch: {
  notification_time?: string;
  timezone?: string;
}): Promise<UserSettings> {
  const { data } = await apiClient.put<UserSettings>('/api/settings', patch);
  return data;
}

export async function updateNotificationTime(notificationTime: string): Promise<UserSettings> {
  return updateSettings({ notification_time: notificationTime });
}

export { apiClient, getApiBaseUrl } from './client.js';
export type * from './types.js';
