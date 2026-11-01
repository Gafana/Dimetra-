import { v4 as uuidv4 } from 'uuid';
import { getCareIntervals, findCatalogPlant } from '../lib/catalog.js';
import { addDaysToIsoDate, nowIsoDateTime } from '../lib/dates.js';
import { execute, query, queryOne } from '../db/pool.js';
import type { Season } from '../db/catalog.js';
import { HttpError } from '../lib/errors.js';
import type { CareActionType, CareHistoryRow, UserPlantRow, UserPlantWithCareStatus } from '../types/models.js';
import { todayIsoDateInTimeZone } from '../lib/time.js';
import {
  closeOpenObligationForAction,
  syncCareObligationsForPlant,
  type ObligationCareAction,
} from './careObligationService.js';
import { attachCareStatusToPlant } from './plantCareStatusService.js';
import { ensureSettingsForChat } from './settingsService.js';

const PLANT_COLUMNS = `id, custom_name, room_id, catalog_id, last_repot_date, current_season,
            next_watering_date, next_feeding_date, photo_url, created_at`;
import { roomExists } from './roomsService.js';

interface CreatePlantInput {
  custom_name: string;
  room_id?: string | null;
  catalog_id: string;
  last_repot_date?: string | null;
  current_season: Season;
}

async function getPlantOrThrow(telegramChatId: string, plantId: string): Promise<UserPlantRow> {
  const plant = await queryOne<UserPlantRow>(
    `SELECT ${PLANT_COLUMNS}
     FROM user_plants
     WHERE id = $1 AND telegram_chat_id = $2`,
    [plantId, telegramChatId],
  );

  if (!plant) {
    throw new HttpError('Plant not found', 404);
  }
  return plant;
}

async function getPlantResponse(
  telegramChatId: string,
  plantId: string,
): Promise<UserPlantWithCareStatus> {
  return attachCareStatusToPlant(telegramChatId, await getPlantOrThrow(telegramChatId, plantId));
}

async function attachCareStatus(
  telegramChatId: string,
  plant: UserPlantRow,
): Promise<UserPlantWithCareStatus> {
  return attachCareStatusToPlant(telegramChatId, plant);
}

async function insertCareHistory(
  plantId: string,
  actionType: CareActionType,
  doneAt: string,
): Promise<string> {
  const id = uuidv4();
  await execute(
    `INSERT INTO care_history (id, plant_id, action_type, done_at)
     VALUES ($1, $2, $3, $4)`,
    [id, plantId, actionType, doneAt],
  );
  return id;
}

async function todayForUser(telegramChatId: string): Promise<string> {
  const settings = await ensureSettingsForChat(telegramChatId);
  return todayIsoDateInTimeZone(settings.timezone);
}

export async function createPlant(
  telegramChatId: string,
  input: CreatePlantInput,
): Promise<UserPlantWithCareStatus> {
  if (!(await findCatalogPlant(input.catalog_id))) {
    throw new HttpError(`Unknown catalog_id: ${input.catalog_id}`, 400);
  }

  if (input.room_id && !(await roomExists(telegramChatId, input.room_id))) {
    throw new HttpError('Room not found', 404);
  }

  const intervals = await getCareIntervals(input.catalog_id, input.current_season);
  const baseDate = await todayForUser(telegramChatId);

  const plant = {
    id: uuidv4(),
    custom_name: input.custom_name,
    room_id: input.room_id ?? null,
    telegram_chat_id: telegramChatId,
    catalog_id: input.catalog_id,
    last_repot_date: input.last_repot_date ?? null,
    current_season: input.current_season,
    next_watering_date: addDaysToIsoDate(baseDate, intervals.wateringDays),
    next_feeding_date: addDaysToIsoDate(baseDate, intervals.feedingDays),
    created_at: nowIsoDateTime(),
  };

  await execute(
    `INSERT INTO user_plants (
       id, custom_name, room_id, telegram_chat_id, catalog_id, last_repot_date, current_season,
       next_watering_date, next_feeding_date, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      plant.id,
      plant.custom_name,
      plant.room_id,
      plant.telegram_chat_id,
      plant.catalog_id,
      plant.last_repot_date,
      plant.current_season,
      plant.next_watering_date,
      plant.next_feeding_date,
      plant.created_at,
    ],
  );

  return getPlantResponse(telegramChatId, plant.id);
}

export interface UpdatePlantScheduleInput {
  next_watering_date?: string | null;
  next_feeding_date?: string | null;
}

export async function updatePlantSchedule(
  telegramChatId: string,
  plantId: string,
  input: UpdatePlantScheduleInput,
): Promise<UserPlantWithCareStatus> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);
  const nextWatering =
    input.next_watering_date !== undefined ? input.next_watering_date : plant.next_watering_date;
  const nextFeeding =
    input.next_feeding_date !== undefined ? input.next_feeding_date : plant.next_feeding_date;

  await execute(
    `UPDATE user_plants
     SET next_watering_date = $1, next_feeding_date = $2
     WHERE id = $3 AND telegram_chat_id = $4`,
    [nextWatering, nextFeeding, plantId, telegramChatId],
  );

  const todayIso = await todayForUser(telegramChatId);
  await syncCareObligationsForPlant(
    { id: plantId, next_watering_date: nextWatering, next_feeding_date: nextFeeding },
    todayIso,
  );

  return getPlantResponse(telegramChatId, plantId);
}

export async function updatePlantPhoto(
  telegramChatId: string,
  plantId: string,
  photoUrl: string | null,
): Promise<UserPlantWithCareStatus> {
  await getPlantOrThrow(telegramChatId, plantId);
  await execute(
    `UPDATE user_plants SET photo_url = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [photoUrl, plantId, telegramChatId],
  );
  return getPlantResponse(telegramChatId, plantId);
}

export interface UpdatePlantInput {
  custom_name?: string;
  room_id?: string | null;
  current_season?: Season;
  next_watering_date?: string | null;
  next_feeding_date?: string | null;
}

export async function updatePlant(
  telegramChatId: string,
  plantId: string,
  input: UpdatePlantInput,
): Promise<UserPlantRow> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);

  if (input.room_id !== undefined && input.room_id !== null) {
    if (!(await roomExists(telegramChatId, input.room_id))) {
      throw new HttpError('Room not found', 404);
    }
  }

  const customName = input.custom_name ?? plant.custom_name;
  const roomId = input.room_id !== undefined ? input.room_id : plant.room_id;
  const season = input.current_season ?? plant.current_season;
  const nextWatering =
    input.next_watering_date !== undefined ? input.next_watering_date : plant.next_watering_date;
  const nextFeeding =
    input.next_feeding_date !== undefined ? input.next_feeding_date : plant.next_feeding_date;

  await execute(
    `UPDATE user_plants
     SET custom_name = $1, room_id = $2, current_season = $3,
         next_watering_date = $4, next_feeding_date = $5
     WHERE id = $6 AND telegram_chat_id = $7`,
    [customName, roomId, season, nextWatering, nextFeeding, plantId, telegramChatId],
  );

  const todayIso = await todayForUser(telegramChatId);
  await syncCareObligationsForPlant(
    { id: plantId, next_watering_date: nextWatering, next_feeding_date: nextFeeding },
    todayIso,
  );

  return getPlantResponse(telegramChatId, plantId);
}

export async function deletePlant(telegramChatId: string, plantId: string): Promise<void> {
  await getPlantOrThrow(telegramChatId, plantId);
  await execute(`DELETE FROM user_plants WHERE id = $1 AND telegram_chat_id = $2`, [
    plantId,
    telegramChatId,
  ]);
}

export async function listPlantCareHistory(
  telegramChatId: string,
  plantId: string,
): Promise<CareHistoryRow[]> {
  await getPlantOrThrow(telegramChatId, plantId);
  return query<CareHistoryRow>(
    `SELECT id, plant_id, action_type, done_at
     FROM care_history
     WHERE plant_id = $1
     ORDER BY done_at DESC`,
    [plantId],
  );
}

export async function recordPlantAction(
  telegramChatId: string,
  plantId: string,
  actionType: ObligationCareAction,
): Promise<UserPlantWithCareStatus> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);
  const intervals = await getCareIntervals(plant.catalog_id, plant.current_season);
  const doneDate = await todayForUser(telegramChatId);
  const doneAt = nowIsoDateTime();

  const historyId = await insertCareHistory(plantId, actionType, doneAt);
  await closeOpenObligationForAction(plantId, actionType, historyId);

  if (actionType === 'watering') {
    const nextWatering = addDaysToIsoDate(doneDate, intervals.wateringDays);
    await execute(
      `UPDATE user_plants SET next_watering_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
      [nextWatering, plantId, telegramChatId],
    );
    await syncCareObligationsForPlant(
      { id: plantId, next_watering_date: nextWatering, next_feeding_date: plant.next_feeding_date },
      doneDate,
    );
    return attachCareStatus(telegramChatId, { ...plant, next_watering_date: nextWatering });
  }

  const nextFeeding = addDaysToIsoDate(doneDate, intervals.feedingDays);
  await execute(
    `UPDATE user_plants SET next_feeding_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [nextFeeding, plantId, telegramChatId],
  );
  await syncCareObligationsForPlant(
    { id: plantId, next_watering_date: plant.next_watering_date, next_feeding_date: nextFeeding },
    doneDate,
  );
  return attachCareStatus(telegramChatId, { ...plant, next_feeding_date: nextFeeding });
}

export async function recordRepot(
  telegramChatId: string,
  plantId: string,
): Promise<UserPlantWithCareStatus> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);
  const repotDate = await todayForUser(telegramChatId);

  await insertCareHistory(plantId, 'repot', nowIsoDateTime());

  await execute(
    `UPDATE user_plants SET last_repot_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [repotDate, plantId, telegramChatId],
  );

  return attachCareStatus(telegramChatId, { ...plant, last_repot_date: repotDate });
}
