import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';
import { isLocalDevServerMode } from './localDevAuth.js';
import { isAdmitted } from '../services/promoService.js';

export const PROMO_REQUIRED_MESSAGE =
  'Доступ откроется после промокода в личном чате с ботом.';

export function requirePromoAccess(req: Request, _res: Response, next: NextFunction): void {
  if (isLocalDevServerMode()) {
    next();
    return;
  }

  const telegramChatId = req.telegramChatId;
  if (!telegramChatId) {
    next(new HttpError('Unauthorized', 401));
    return;
  }

  void isAdmitted(telegramChatId)
    .then((admitted) => {
      if (!admitted) {
        next(new HttpError(PROMO_REQUIRED_MESSAGE, 403));
        return;
      }
      next();
    })
    .catch(next);
}
