import request from 'supertest';
import express from 'express';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';
import { createSessionRoutes } from '../../src/routes/session.routes.js';
import { createRequireAuth } from '../../src/middlewares/requireAuth.js';
import { attachCorrelationId } from '../../src/middlewares/correlationId.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

function buildContainerWith(loginImpl) {
  return { sessionRoutes: createSessionRoutes({ authService: { login: loginImpl } }) };
}

describe('POST /api/sessions', () => {
  test('returns token and user on valid credentials', async () => {
    const container = buildContainerWith(async () => ({
      token: 'signed-token',
      user: { id: 'user-1', name: 'Lia', email: 'lia@exemplo.local', role: 'requester', active: true },
    }));
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'lia@exemplo.local', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBe('signed-token');
    expect(response.body.data.user).not.toHaveProperty('password_hash');
  });

  test('returns generic 401 on invalid credentials', async () => {
    const container = buildContainerWith(async () => {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas.');
    });
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'ghost@exemplo.local', password: 'anything' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciais inválidas.',
        correlationId: expect.any(String),
      },
    });
  });

  test('returns 423 when account is locked', async () => {
    const container = buildContainerWith(async () => {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Acesso temporariamente indisponível.');
    });
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'lia@exemplo.local', password: 'wrong' });

    expect(response.status).toBe(423);
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  test('rejects malformed payload with 400', async () => {
    const container = buildContainerWith(async () => ({ token: 'x', user: {} }));
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('requireAuth', () => {
  function buildProbeApp(verifyToken) {
    const app = express();
    app.use(attachCorrelationId);
    app.use(express.json());
    app.get('/protected', createRequireAuth({ verifyToken }), (req, res) => res.status(200).json({ data: req.user }));
    app.use(errorHandler);
    return app;
  }

  test('sets req.user on valid token', async () => {
    const app = buildProbeApp(async () => ({ sub: 'user-1', role: 'requester' }));
    const response = await request(app).get('/protected').set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 'user-1', role: 'requester' });
  });

  test.each([['missing header', undefined], ['tampered token', 'Bearer tampered']])(
    'rejects %s with 401',
    async (_label, header) => {
      const app = buildProbeApp(async () => {
        throw new Error('invalid');
      });
      const agent = request(app).get('/protected');
      const response = header ? await agent.set('Authorization', header) : await agent;

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    }
  );
});
