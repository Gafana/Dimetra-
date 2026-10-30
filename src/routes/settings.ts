import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateSettingsBodySchema } from '../schemas/validation.js';
import { ensureSettingsForChat, updateNotificationTime } from '../services/settingsService.js';

export const settingsRouter = Router();

settingsRouter.get('/', async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const settings = await ensureSettingsForChat(telegramChatId);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

settingsRouter.put('/', validateBody(updateSettingsBodySchema), async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const { notification_time } = req.body as { notification_time: string };
    const settings = await updateNotificationTime(telegramChatId, notification_time);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});
