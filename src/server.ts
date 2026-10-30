import cors from 'cors';
import express from 'express';
import { telegramAuthMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { catalogRouter } from './routes/catalog.js';
import { plantsRouter } from './routes/plants.js';
import { roomsRouter } from './routes/rooms.js';
import { settingsRouter } from './routes/settings.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/catalog', catalogRouter);

  app.use('/api/rooms', telegramAuthMiddleware, roomsRouter);
  app.use('/api/plants', telegramAuthMiddleware, plantsRouter);
  app.use('/api/settings', telegramAuthMiddleware, settingsRouter);

  app.use(errorHandler);

  return app;
}
