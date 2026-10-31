import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  createPlantBodySchema,
  plantActionBodySchema,
  plantIdParamSchema,
  updatePlantBodySchema,
  updatePlantPhotoBodySchema,
  updatePlantScheduleBodySchema,
} from '../schemas/validation.js';
import {
  createPlant,
  deletePlant,
  listPlantCareHistory,
  recordPlantAction,
  recordRepot,
  updatePlant,
  updatePlantPhoto,
  updatePlantSchedule,
} from '../services/plantsService.js';

export const plantsRouter = Router();

plantsRouter.post('/', validateBody(createPlantBodySchema), async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const plant = await createPlant(telegramChatId, req.body);
    res.status(201).json(plant);
  } catch (error) {
    next(error);
  }
});

plantsRouter.get(
  '/:id/history',
  validateParams(plantIdParamSchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      res.json(await listPlantCareHistory(telegramChatId, id));
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.patch(
  '/:id',
  validateParams(plantIdParamSchema),
  validateBody(updatePlantBodySchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      res.json(await updatePlant(telegramChatId, id, req.body));
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.delete(
  '/:id',
  validateParams(plantIdParamSchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      await deletePlant(telegramChatId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.patch(
  '/:id/schedule',
  validateParams(plantIdParamSchema),
  validateBody(updatePlantScheduleBodySchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      const body = req.body as {
        next_watering_date?: string | null;
        next_feeding_date?: string | null;
      };
      res.json(await updatePlantSchedule(telegramChatId, id, body));
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.patch(
  '/:id/photo',
  validateParams(plantIdParamSchema),
  validateBody(updatePlantPhotoBodySchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      const { photo_url } = req.body as { photo_url: string | null };
      res.json(await updatePlantPhoto(telegramChatId, id, photo_url));
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.post(
  '/:id/action',
  validateParams(plantIdParamSchema),
  validateBody(plantActionBodySchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      const { action_type } = req.body as { action_type: 'watering' | 'feeding' };
      const plant = await recordPlantAction(telegramChatId, id, action_type);
      res.json(plant);
    } catch (error) {
      next(error);
    }
  },
);

plantsRouter.post(
  '/:id/repot',
  validateParams(plantIdParamSchema),
  async (req, res, next) => {
    try {
      const telegramChatId = requireTelegramChatId(req);
      const { id } = req.params as { id: string };
      const plant = await recordRepot(telegramChatId, id);
      res.json(plant);
    } catch (error) {
      next(error);
    }
  },
);
