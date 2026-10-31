import { v4 as uuidv4 } from 'uuid';
import { execute, query, queryOne } from '../db/pool.js';
import { nowIsoDateTime } from '../lib/dates.js';
import type { CareActionType } from '../types/models.js';

export type ObligationCareAction = 'watering' | 'feeding';

export interface CareObligationRow {
  id: string;
  plant_id: string;
  action_type: ObligationCareAction;
  due_date: string;
  status: 'open' | 'closed';
  closed_at: string | null;
  completion_history_id: string | null;
  created_at: string;
}

export interface CareObligationWithPlant extends CareObligationRow {
  plant_name: string;
  room_name: string | null;
}

interface PlantScheduleRow {
  id: string;
  next_watering_date: string | null;
  next_feeding_date: string | null;
}

function nextDateForAction(plant: PlantScheduleRow, actionType: ObligationCareAction): string | null {
  return actionType === 'watering' ? plant.next_watering_date : plant.next_feeding_date;
}

async function findOpenObligation(
  plantId: string,
  actionType: ObligationCareAction,
): Promise<CareObligationRow | undefined> {
  return queryOne<CareObligationRow>(
    `SELECT id, plant_id, action_type, due_date, status, closed_at, completion_history_id, created_at
     FROM care_obligations
     WHERE plant_id = $1 AND action_type = $2 AND status = 'open'`,
    [plantId, actionType],
  );
}

async function upsertOpenObligation(
  plantId: string,
  actionType: ObligationCareAction,
  dueDate: string,
): Promise<void> {
  const existing = await findOpenObligation(plantId, actionType);
  if (existing) {
    if (existing.due_date !== dueDate) {
      await execute(`UPDATE care_obligations SET due_date = $1 WHERE id = $2`, [
        dueDate,
        existing.id,
      ]);
    }
    return;
  }

  await execute(
    `INSERT INTO care_obligations (
       id, plant_id, action_type, due_date, status, closed_at, completion_history_id, created_at
     ) VALUES ($1, $2, $3, $4, 'open', NULL, NULL, $5)`,
    [uuidv4(), plantId, actionType, dueDate, nowIsoDateTime()],
  );
}

async function clearOpenObligationsForAction(
  plantId: string,
  actionType: ObligationCareAction,
): Promise<void> {
  await execute(
    `DELETE FROM care_obligations
     WHERE plant_id = $1 AND action_type = $2 AND status = 'open'`,
    [plantId, actionType],
  );
}

/** Синхронизирует открытые просрочки с полями next_* (одна открытая на тип ухода). */
export async function syncCareObligationsForPlant(
  plant: PlantScheduleRow,
  todayIso: string,
): Promise<void> {
  for (const actionType of ['watering', 'feeding'] as const) {
    const nextDate = nextDateForAction(plant, actionType);
    if (nextDate && nextDate < todayIso) {
      await upsertOpenObligation(plant.id, actionType, nextDate);
      continue;
    }
    await clearOpenObligationsForAction(plant.id, actionType);
  }
}

export async function syncCareObligationsForUser(
  telegramChatId: string,
  todayIso: string,
): Promise<void> {
  const plants = await query<PlantScheduleRow>(
    `SELECT id, next_watering_date, next_feeding_date
     FROM user_plants
     WHERE telegram_chat_id = $1`,
    [telegramChatId],
  );
  for (const plant of plants) {
    await syncCareObligationsForPlant(plant, todayIso);
  }
}

export async function closeOpenObligationForAction(
  plantId: string,
  actionType: ObligationCareAction,
  completionHistoryId: string,
): Promise<void> {
  const closedAt = nowIsoDateTime();
  await execute(
    `UPDATE care_obligations
     SET status = 'closed', closed_at = $1, completion_history_id = $2
     WHERE plant_id = $3 AND action_type = $4 AND status = 'open'`,
    [closedAt, completionHistoryId, plantId, actionType],
  );
}

export async function listOpenObligationsForUser(
  telegramChatId: string,
): Promise<CareObligationWithPlant[]> {
  return query<CareObligationWithPlant>(
    `SELECT co.id, co.plant_id, co.action_type, co.due_date, co.status,
            co.closed_at, co.completion_history_id, co.created_at,
            up.custom_name AS plant_name, r.name AS room_name
     FROM care_obligations co
     INNER JOIN user_plants up ON up.id = co.plant_id
     LEFT JOIN rooms r ON r.id = up.room_id
     WHERE up.telegram_chat_id = $1 AND co.status = 'open'
     ORDER BY co.due_date ASC, LOWER(up.custom_name) ASC`,
    [telegramChatId],
  );
}

export async function listObligationsInRange(
  telegramChatId: string,
  from: string,
  to: string,
): Promise<CareObligationWithPlant[]> {
  return query<CareObligationWithPlant>(
    `SELECT co.id, co.plant_id, co.action_type, co.due_date, co.status,
            co.closed_at, co.completion_history_id, co.created_at,
            up.custom_name AS plant_name, r.name AS room_name
     FROM care_obligations co
     INNER JOIN user_plants up ON up.id = co.plant_id
     LEFT JOIN rooms r ON r.id = up.room_id
     WHERE up.telegram_chat_id = $1
       AND co.due_date >= $2
       AND co.due_date <= $3
       AND (
         co.status = 'open'
         OR (co.status = 'closed' AND co.completion_history_id IS NOT NULL)
       )
     ORDER BY co.due_date ASC, LOWER(up.custom_name) ASC`,
    [telegramChatId, from, to],
  );
}

export function isObligationAction(actionType: CareActionType): actionType is ObligationCareAction {
  return actionType === 'watering' || actionType === 'feeding';
}
