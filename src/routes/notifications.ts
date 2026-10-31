import { Router } from 'express';
import { getBot } from '../bot.js';
import { requireTelegramChatId } from '../middleware/auth.js';
import { runNotificationCheckForUser } from '../lib/notificationWake.js';

export const notificationsRouter = Router();

/** Пробуждает проверку уведомлений для текущего пользователя (после открытия Mini App). */
notificationsRouter.post('/wake', async (req, res, next) => {
  try {
    const telegramChatId = requireTelegramChatId(req);
    const bot = getBot();
    if (!bot) {
      res.status(503).json({ ok: false, reason: 'bot_unavailable' });
      return;
    }
    await runNotificationCheckForUser(bot, telegramChatId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
