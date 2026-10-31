import { v4 as uuidv4 } from 'uuid';
import { execute, query, queryOne } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';
import type { RoomRow, RoomWithPlants, UserPlantRow } from '../types/models.js';
import { attachCareStatusToPlants } from './plantCareStatusService.js';

export async function listRoomsWithPlants(telegramChatId: string): Promise<RoomWithPlants[]> {
  const rooms = await query<{ id: string; name: string }>(
    `SELECT id, name
     FROM rooms
     WHERE telegram_chat_id = $1
     ORDER BY LOWER(name)`,
    [telegramChatId],
  );

  const roomIds = rooms.map((room) => room.id);
  if (roomIds.length === 0) {
    return [];
  }

  const placeholders = roomIds.map((_, index) => `$${index + 2}`).join(', ');
  const plants = await query<UserPlantRow>(
    `SELECT id, custom_name, room_id, catalog_id, last_repot_date, current_season,
            next_watering_date, next_feeding_date, photo_url, created_at
     FROM user_plants
     WHERE telegram_chat_id = $1
       AND room_id IN (${placeholders})
     ORDER BY LOWER(custom_name)`,
    [telegramChatId, ...roomIds],
  );

  const plantsByRoom = new Map<string, UserPlantRow[]>();
  for (const plant of plants) {
    if (!plant.room_id) continue;
    const list = plantsByRoom.get(plant.room_id) ?? [];
    list.push(plant);
    plantsByRoom.set(plant.room_id, list);
  }

  const enrichedById = new Map(
    (await attachCareStatusToPlants(telegramChatId, plants)).map((plant) => [plant.id, plant]),
  );

  return rooms.map((room) => ({
    ...room,
    plants: (plantsByRoom.get(room.id) ?? [])
      .map((plant) => enrichedById.get(plant.id)!)
      .filter(Boolean),
  }));
}

export async function createRoom(
  telegramChatId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const id = uuidv4();
  await query(
    `INSERT INTO rooms (id, name, telegram_chat_id)
     VALUES ($1, $2, $3)`,
    [id, name, telegramChatId],
  );
  return { id, name };
}

async function getRoomOrThrow(telegramChatId: string, roomId: string): Promise<RoomRow> {
  const room = await queryOne<RoomRow>(
    `SELECT id, name FROM rooms WHERE id = $1 AND telegram_chat_id = $2`,
    [roomId, telegramChatId],
  );
  if (!room) {
    throw new HttpError('Room not found', 404);
  }
  return room;
}

export async function updateRoom(
  telegramChatId: string,
  roomId: string,
  name: string,
): Promise<RoomRow> {
  await getRoomOrThrow(telegramChatId, roomId);
  await execute(`UPDATE rooms SET name = $1 WHERE id = $2 AND telegram_chat_id = $3`, [
    name,
    roomId,
    telegramChatId,
  ]);
  return { id: roomId, name };
}

export async function deleteRoom(telegramChatId: string, roomId: string): Promise<void> {
  const result = await queryOne<{ id: string }>(
    `DELETE FROM rooms WHERE id = $1 AND telegram_chat_id = $2 RETURNING id`,
    [roomId, telegramChatId],
  );
  if (!result) {
    throw new HttpError('Room not found', 404);
  }
}

export async function roomExists(telegramChatId: string, roomId: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 AS ok FROM rooms WHERE id = $1 AND telegram_chat_id = $2`,
    [roomId, telegramChatId],
  );
  return Boolean(row);
}
