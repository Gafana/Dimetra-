import type { NextFunction, Request, Response } from 'express';
import { telegramAuthMiddleware } from './auth.js';
import { isLocalDevServerMode, localDevAuthMiddleware } from './localDevAuth.js';

export function apiAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isLocalDevServerMode()) {
    localDevAuthMiddleware(req, res, next);
    return;
  }
  telegramAuthMiddleware(req, res, next);
}
