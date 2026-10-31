import cors from 'cors';
import express from 'express';
import { apiAuthMiddleware } from './middleware/apiAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requirePromoAccess } from './middleware/promoAccess.js';
import { accessRouter } from './routes/access.js';
import { calendarRouter } from './routes/calendar.js';
import { encyclopediaRouter } from './routes/encyclopedia.js';
import { catalogRouter } from './routes/catalog.js';
import { plantsRouter } from './routes/plants.js';
import { roomsRouter } from './routes/rooms.js';
import { settingsRouter } from './routes/settings.js';
import { notificationsRouter } from './routes/notifications.js';
import { maybeWakeNotificationCheck } from './lib/notificationWake.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '512kb' }));

  app.get('/health', (_req, res) => {
    maybeWakeNotificationCheck('health');
    res.json({ ok: true });
  });

  app.use('/api/catalog', catalogRouter);
  app.use('/api/access', apiAuthMiddleware, accessRouter);

  app.use('/api/calendar', apiAuthMiddleware, requirePromoAccess, calendarRouter);
  app.use('/api/encyclopedia', apiAuthMiddleware, requirePromoAccess, encyclopediaRouter);
  app.use('/api/rooms', apiAuthMiddleware, requirePromoAccess, roomsRouter);
  app.use('/api/plants', apiAuthMiddleware, requirePromoAccess, plantsRouter);
  app.use('/api/settings', apiAuthMiddleware, requirePromoAccess, settingsRouter);
  app.use('/api/notifications', apiAuthMiddleware, requirePromoAccess, notificationsRouter);

  app.use(errorHandler);

  return app;
}
