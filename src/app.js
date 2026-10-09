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
    // Necessário para o navegador enviar o cookie httpOnly (fetch credentials:include).
    credentials: true,
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
  if (activeContainer.sessionRoutes) {
    app.use('/api', activeContainer.sessionRoutes);
  }
  if (activeContainer.ticketRoutes) {
    app.use('/api', activeContainer.ticketRoutes);
  }
  if (activeContainer.reportRoutes) {
    app.use('/api', activeContainer.reportRoutes);
  }
  if (activeContainer.userRoutes) {
    app.use('/api', activeContainer.userRoutes);
  }
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
