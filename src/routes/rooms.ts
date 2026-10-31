import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  createRoomBodySchema,
  roomIdParamSchema,
  updateRoomBodySchema,
} from '../schemas/validation.js';
import {
  createRoom,
  deleteRoom,
  listRoomsWithPlants,
  updateRoom,
} from '../services/roomsService.js';

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

roomsRouter.put(
  '/:id',
  validateParams(roomIdParamSchema),
  validateBody(updateRoomBodySchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params;
      const { name } = req.body as { name: string };
      res.json(await updateRoom(telegramChatId, id, name));
    } catch (error) {
      next(error);
    }
  },
);

roomsRouter.delete(
  '/:id',
  validateParams(roomIdParamSchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params;
      await deleteRoom(telegramChatId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
