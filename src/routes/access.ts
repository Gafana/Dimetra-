import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { isLocalDevServerMode } from '../middleware/localDevAuth.js';
import { getUserAccess } from '../services/promoService.js';

export const accessRouter = Router();

accessRouter.get('/', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    if (isLocalDevServerMode()) {
      res.json({ admitted: true });
      return;
    }

    const telegramId = requireTelegramChatId(req);
    const access = await getUserAccess(telegramId);
    res.json({ admitted: access.admitted });
  } catch (error) {
    next(error);
  }
});
