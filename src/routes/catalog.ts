import { Router } from 'express';
import { getPlantCatalog, getPlantCatalogPicker } from '../lib/catalog.js';

export const catalogRouter = Router();

catalogRouter.get('/picker', async (_req, res, next) => {
  try {
    res.json(await getPlantCatalogPicker());
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
    res.json(await getPlantCatalog(q));
  } catch (error) {
    next(error);
  }
});
