import express from 'express';
import request from 'supertest';
import { AppError } from '../../src/utils/AppError.js';
import { attachCorrelationId } from '../../src/middlewares/correlationId.js';
import { notFound } from '../../src/middlewares/notFound.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

function buildProbeApp() {
  const app = express();
  app.use(attachCorrelationId);
  app.get('/operational', (req, res, next) => next(new AppError(422, 'VALIDATION_ERROR', 'Invalid input')));
  app.get('/unknown', (req, res, next) => next(new Error('boom')));
  app.get('/leak', (req, res, next) => {
    const error = new Error('select * from users');
    error.stack = 'stack-trace-secret';
    next(error);
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('error contract', () => {
  test('returns contract on unknown routes', async () => {
    const response = await request(buildProbeApp()).get('/missing');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.correlationId).toBeDefined();
    expect(response.headers['x-correlation-id']).toBe(response.body.error.correlationId);
  });

  test('keeps operational error status and code', async () => {
    const response = await request(buildProbeApp()).get('/operational');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        correlationId: expect.any(String),
      },
    });
  });

  test('hides internals from unknown errors', async () => {
    const response = await request(buildProbeApp()).get('/unknown');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toMatch(/boom|stack/i);
    expect(response.body.error.correlationId).toBeDefined();
  });

  test('never exposes sql or stack traces', async () => {
    const response = await request(buildProbeApp()).get('/leak');

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toMatch(/select|stack-trace-secret/i);
  });

  test('propagates incoming correlation id', async () => {
    const incoming = '123e4567-e89b-42d3-a456-426614174000';
    const response = await request(buildProbeApp())
      .get('/missing')
      .set('X-Correlation-Id', incoming);

    expect(response.body.error.correlationId).toBe(incoming);
    expect(response.headers['x-correlation-id']).toBe(incoming);
  });
});
