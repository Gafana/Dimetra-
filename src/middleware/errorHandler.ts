import type { NextFunction, Request, Response } from 'express';
import { HttpError, isHttpError } from '../lib/errors.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isHttpError(error)) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
