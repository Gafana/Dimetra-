import { Router } from 'express';
import { PLANT_CATALOG } from '../lib/catalog.js';

export const catalogRouter = Router();

catalogRouter.get('/', (_req, res) => {
  res.json(PLANT_CATALOG);
});
