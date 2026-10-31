import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { HttpError } from '../lib/errors.js';
import { calendarQuerySchema } from '../schemas/validation.js';
import { listCalendarEvents } from '../services/calendarService.js';

export const calendarRouter = Router();

calendarRouter.get('/', async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const parsed = calendarQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new HttpError(parsed.error.errors.map((e) => e.message).join('; '), 400);
    }

    const { from, to } = parsed.data;
    if (from > to) {
      throw new HttpError('from must be on or before to', 400);
    }

    res.json(await listCalendarEvents(telegramChatId, from, to));
  } catch (error) {
    next(error);
  }
});
