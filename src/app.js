import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { loadEnv } from './config/env.js';
import { buildContainer } from './container.js';
import { attachCorrelationId } from './middlewares/correlationId.js';
import healthRoutes from './routes/health.routes.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const JSON_LIMIT = '100kb';

function buildCorsOptions(corsOrigins) {
  return {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    maxAge: 600,
  };
}

export function createApp({ corsOrigins = [], container = null } = {}) {
  const app = express();
  const activeContainer = container || buildContainer(loadEnv(process.env));

  app.use(attachCorrelationId);
  app.use(helmet());
  app.use(cors(buildCorsOptions(corsOrigins)));
  app.use(express.json({ limit: JSON_LIMIT }));

  app.use(healthRoutes);
  app.use('/api', activeContainer.sessionRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
