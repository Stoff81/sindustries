import express from 'express';
import { healthRouter } from './routes/health.js';
import { tasksRouter } from './routes/tasks.js';
import { tagsRouter } from './routes/tags.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'tasks-api' });
  });

  app.use('/api/v1', healthRouter);
  app.use('/api/v1', tasksRouter);
  app.use('/api/v1', tagsRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
