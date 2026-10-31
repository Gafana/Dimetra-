import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';

export function isLocalDevServerMode(): boolean {
  return process.env.LOCAL_DEV === 'true' && process.env.NODE_ENV !== 'production';
}

export function localDevAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!isLocalDevServerMode()) {
      throw new HttpError('Local dev auth is not enabled', 401);
    }

    const fromHeader = req.header('X-Local-Dev-Chat-Id')?.trim();
    const fromEnv = process.env.LOCAL_DEV_CHAT_ID?.trim();
    const chatId = fromHeader || fromEnv;

    if (!chatId) {
      throw new HttpError(
        'Local dev: set LOCAL_DEV_CHAT_ID on the server or X-Local-Dev-Chat-Id on the request',
        401,
      );
    }

    req.telegramChatId = chatId;
    next();
  } catch (error) {
    next(error);
  }
}
