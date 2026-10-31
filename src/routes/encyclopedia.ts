import { Router } from 'express';
import { HttpError } from '../lib/errors.js';
import { requireTelegramChatId } from '../middleware/auth.js';
import { isLocalDevServerMode } from '../middleware/localDevAuth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  plantCatalogIdParamSchema,
  upsertPlantCatalogBodySchema,
} from '../schemas/validation.js';
import {
  createPlantCatalogEntry,
  deletePlantCatalogEntry,
  findPlantCatalogById,
  listPlantCatalog,
  updatePlantCatalogEntry,
  type UpsertPlantCatalogInput,
} from '../services/plantCatalogService.js';

export const encyclopediaRouter = Router();

encyclopediaRouter.get('/', async (req, res, next) => {
  try {
    requireTelegramChatId(req);
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(await listPlantCatalog(q));
  } catch (error) {
    next(error);
  }
});

encyclopediaRouter.get(
  '/:id',
  validateParams(plantCatalogIdParamSchema),
  async (req, res, next) => {
    try {
      requireTelegramChatId(req);
      const { id } = req.params;
      const entry = await findPlantCatalogById(id);
      if (!entry) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(entry);
    } catch (error) {
      next(error);
    }
  },
);

encyclopediaRouter.post('/', validateBody(upsertPlantCatalogBodySchema), async (req, res, next) => {
  try {
    requireTelegramChatId(req);
    const body = req.body as UpsertPlantCatalogInput;
    const created = await createPlantCatalogEntry(body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

encyclopediaRouter.put(
  '/:id',
  validateParams(plantCatalogIdParamSchema),
  validateBody(upsertPlantCatalogBodySchema),
  async (req, res, next) => {
    try {
      requireTelegramChatId(req);
      const { id } = req.params;
      const body = req.body as UpsertPlantCatalogInput;
      res.json(await updatePlantCatalogEntry(id, body));
    } catch (error) {
      next(error);
    }
  },
);

encyclopediaRouter.delete(
  '/:id',
  validateParams(plantCatalogIdParamSchema),
  async (req, res, next) => {
    try {
      requireTelegramChatId(req);
      if (!isLocalDevServerMode()) {
        throw new HttpError('Удаление записей энциклопедии доступно только в локальной разработке', 403);
      }
      const { id } = req.params;
      await deletePlantCatalogEntry(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);
