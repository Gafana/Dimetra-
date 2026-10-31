import { Router } from 'express';
import { requireTelegramChatId } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateSettingsBodySchema } from '../schemas/validation.js';
import { ensureSettingsForChat, updateUserSettings } from '../services/settingsService.js';

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
    const body = req.body as { notification_time?: string; timezone?: string };
    const settings = await updateUserSettings(telegramChatId, body);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});
