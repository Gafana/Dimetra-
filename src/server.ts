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

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '512kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/catalog', catalogRouter);
  app.use('/api/access', apiAuthMiddleware, accessRouter);

  app.use('/api/calendar', apiAuthMiddleware, requirePromoAccess, calendarRouter);
  app.use('/api/encyclopedia', apiAuthMiddleware, requirePromoAccess, encyclopediaRouter);
  app.use('/api/rooms', apiAuthMiddleware, requirePromoAccess, roomsRouter);
  app.use('/api/plants', apiAuthMiddleware, requirePromoAccess, plantsRouter);
  app.use('/api/settings', apiAuthMiddleware, requirePromoAccess, settingsRouter);

  app.use(errorHandler);

  return app;
}
