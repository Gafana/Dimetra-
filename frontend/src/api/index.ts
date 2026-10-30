import { apiClient } from './client.js';
import type {
  CreatePlantPayload,
  PlantCatalogEntry,
  PlantCareAction,
  RoomSummary,
  RoomWithPlants,
  UserPlant,
  UserSettings,
} from './types.js';

export async function fetchRooms(): Promise<RoomWithPlants[]> {
  const { data } = await apiClient.get<RoomWithPlants[]>('/api/rooms');
  return data;
}

export async function createRoom(name: string): Promise<RoomSummary> {
  const { data } = await apiClient.post<RoomSummary>('/api/rooms', { name });
  return data;
}

export async function fetchCatalog(): Promise<PlantCatalogEntry[]> {
  const { data } = await apiClient.get<PlantCatalogEntry[]>('/api/catalog');
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

export async function fetchSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get<UserSettings>('/api/settings');
  return data;
}

export async function updateNotificationTime(notificationTime: string): Promise<UserSettings> {
  const { data } = await apiClient.put<UserSettings>('/api/settings', {
    notification_time: notificationTime,
  });
  return data;
}

export { apiClient, getApiBaseUrl } from './client.js';
export type * from './types.js';
