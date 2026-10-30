import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRoomBodySchema } from '../schemas/validation.js';
import { createRoom, listRoomsWithPlants } from '../services/roomsService.js';

export const roomsRouter = Router();

roomsRouter.get('/', async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    res.json(await listRoomsWithPlants(telegramChatId));
  } catch (error) {
    next(error);
  }
});

roomsRouter.post('/', validateBody(createRoomBodySchema), async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const { name } = req.body as { name: string };
    const room = await createRoom(telegramChatId, name);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});
