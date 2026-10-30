import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  createPlantBodySchema,
  plantActionBodySchema,
  plantIdParamSchema,
} from '../schemas/validation.js';
import { createPlant, recordPlantAction, recordRepot } from '../services/plantsService.js';

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
