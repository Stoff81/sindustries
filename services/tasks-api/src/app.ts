import express from 'express';
import { healthRouter } from './routes/health.ts';
import { tasksRouter } from './routes/tasks.ts';
import { tagsRouter } from './routes/tags.ts';

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'tasks-api' });
  });

  app.use('/api/v1', healthRouter);
  app.use('/api/v1', tasksRouter);
  app.use('/api/v1', tagsRouter);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  });

  return app;
}
