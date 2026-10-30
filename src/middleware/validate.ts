import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(error.errors.map((e) => e.message).join('; '), 400));
        return;
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as Request['params'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(error.errors.map((e) => e.message).join('; '), 400));
        return;
      }
      next(error);
    }
  };
}
