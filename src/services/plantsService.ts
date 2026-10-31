import { v4 as uuidv4 } from 'uuid';
import { getCareIntervals, findCatalogPlant } from '../lib/catalog.js';
import { addDaysToIsoDate, nowIsoDateTime, todayIsoDate } from '../lib/dates.js';
import { execute, query, queryOne } from '../db/pool.js';
import type { Season } from '../db/catalog.js';
import { HttpError } from '../lib/errors.js';
import type { CareActionType, CareHistoryRow, UserPlantRow } from '../types/models.js';

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

async function insertCareHistory(
  plantId: string,
  actionType: CareActionType,
  doneAt: string,
): Promise<void> {
  await execute(
    `INSERT INTO care_history (id, plant_id, action_type, done_at)
     VALUES ($1, $2, $3, $4)`,
    [uuidv4(), plantId, actionType, doneAt],
  );
}

export async function createPlant(
  telegramChatId: string,
  input: CreatePlantInput,
): Promise<UserPlantRow> {
  if (!(await findCatalogPlant(input.catalog_id))) {
    throw new HttpError(`Unknown catalog_id: ${input.catalog_id}`, 400);
  }

  if (input.room_id && !(await roomExists(telegramChatId, input.room_id))) {
    throw new HttpError('Room not found', 404);
  }

  const intervals = await getCareIntervals(input.catalog_id, input.current_season);
  const baseDate = todayIsoDate();

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

  return getPlantOrThrow(telegramChatId, plant.id);
}

export interface UpdatePlantScheduleInput {
  next_watering_date?: string | null;
  next_feeding_date?: string | null;
}

export async function updatePlantSchedule(
  telegramChatId: string,
  plantId: string,
  input: UpdatePlantScheduleInput,
): Promise<UserPlantRow> {
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

  return getPlantOrThrow(telegramChatId, plantId);
}

export async function updatePlantPhoto(
  telegramChatId: string,
  plantId: string,
  photoUrl: string | null,
): Promise<UserPlantRow> {
  await getPlantOrThrow(telegramChatId, plantId);
  await execute(
    `UPDATE user_plants SET photo_url = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [photoUrl, plantId, telegramChatId],
  );
  return getPlantOrThrow(telegramChatId, plantId);
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
  actionType: 'watering' | 'feeding',
): Promise<UserPlantRow> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);
  const intervals = await getCareIntervals(plant.catalog_id, plant.current_season);
  const doneDate = todayIsoDate();

  await insertCareHistory(plantId, actionType, nowIsoDateTime());

  if (actionType === 'watering') {
    const nextWatering = addDaysToIsoDate(doneDate, intervals.wateringDays);
    await execute(
      `UPDATE user_plants SET next_watering_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
      [nextWatering, plantId, telegramChatId],
    );
    return { ...plant, next_watering_date: nextWatering };
  }

  const nextFeeding = addDaysToIsoDate(doneDate, intervals.feedingDays);
  await execute(
    `UPDATE user_plants SET next_feeding_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [nextFeeding, plantId, telegramChatId],
  );
  return { ...plant, next_feeding_date: nextFeeding };
}

export async function recordRepot(telegramChatId: string, plantId: string): Promise<UserPlantRow> {
  const plant = await getPlantOrThrow(telegramChatId, plantId);
  const repotDate = todayIsoDate();

  await insertCareHistory(plantId, 'repot', nowIsoDateTime());

  await execute(
    `UPDATE user_plants SET last_repot_date = $1 WHERE id = $2 AND telegram_chat_id = $3`,
    [repotDate, plantId, telegramChatId],
  );

  return { ...plant, last_repot_date: repotDate };
}
