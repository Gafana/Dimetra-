import { todayIsoDateInTimeZone } from '../lib/time.js';
import { plantCareStatus } from '../lib/plantCareStatus.js';
import type { PlantCareStatus, UserPlantRow } from '../types/models.js';
import { ensureSettingsForChat } from './settingsService.js';

export type UserPlantWithCareStatus = UserPlantRow & { care_status: PlantCareStatus };

export async function attachCareStatusToPlants(
  telegramChatId: string,
  plants: UserPlantRow[],
): Promise<UserPlantWithCareStatus[]> {
  if (plants.length === 0) {
    return [];
  }
  const settings = await ensureSettingsForChat(telegramChatId);
  const todayIso = todayIsoDateInTimeZone(settings.timezone);
  return plants.map((plant) => ({
    ...plant,
    care_status: plantCareStatus(plant, todayIso),
  }));
}

export async function attachCareStatusToPlant(
  telegramChatId: string,
  plant: UserPlantRow,
): Promise<UserPlantWithCareStatus> {
  const [withStatus] = await attachCareStatusToPlants(telegramChatId, [plant]);
  return withStatus!;
}
