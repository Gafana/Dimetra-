import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

function buildDataCheckString(initData: URLSearchParams): string {
  const pairs: string[] = [];
  initData.forEach((value, key) => {
    if (key !== 'hash') {
      pairs.push(`${key}=${value}`);
    }
  });
  pairs.sort((a, b) => a.localeCompare(b));
  return pairs.join('\n');
}

function validateInitData(initDataRaw: string, botToken: string): URLSearchParams {
  const params = new URLSearchParams(initDataRaw);
  const receivedHash = params.get('hash');

  if (!receivedHash) {
    throw new HttpError('Missing hash in X-Telegram-Init-Data', 401);
  }

  const dataCheckString = buildDataCheckString(params);
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== receivedHash) {
    throw new HttpError('Invalid Telegram init data signature', 401);
  }

  return params;
}

function parseTelegramUser(params: URLSearchParams): TelegramWebAppUser {
  const userJson = params.get('user');
  if (!userJson) {
    throw new HttpError('Missing user in Telegram init data', 401);
  }

  let user: unknown;
  try {
    user = JSON.parse(userJson);
  } catch {
    throw new HttpError('Invalid user payload in Telegram init data', 401);
  }

  if (
    typeof user !== 'object' ||
    user === null ||
    typeof (user as TelegramWebAppUser).id !== 'number'
  ) {
    throw new HttpError('Invalid user object in Telegram init data', 401);
  }

  return user as TelegramWebAppUser;
}

export function telegramAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const initDataHeader = req.header('X-Telegram-Init-Data');
    if (!initDataHeader) {
      throw new HttpError('X-Telegram-Init-Data header is required', 401);
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      throw new HttpError('BOT_TOKEN is not configured', 500);
    }

    const params = validateInitData(initDataHeader, botToken);
    const user = parseTelegramUser(params);

    req.telegramChatId = String(user.id);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireTelegramChatId(req: Request): string {
  if (!req.telegramChatId) {
    throw new HttpError('Unauthorized', 401);
  }
  return req.telegramChatId;
}
