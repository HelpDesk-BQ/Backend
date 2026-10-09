import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app.js';
import { createSessionRoutes } from '../../src/routes/session.routes.js';
import { createRequireAuth } from '../../src/middlewares/requireAuth.js';
import { attachCorrelationId } from '../../src/middlewares/correlationId.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

const USER = { id: 'user-1', name: 'Lia', email: 'lia@exemplo.local', role: 'requester', active: true };
const COOKIE_OPTS = { secure: false, maxAgeMs: 3600000 };

function buildContainerWith({ loginImpl, cookie = COOKIE_OPTS, verifyImpl = null }) {
  const authService = { login: loginImpl };
  const controller = { sessionRoutes: createSessionRoutes({ authService, sessionCookie: cookie }) };
  if (verifyImpl) {
    const requireAuth = createRequireAuth({ verifyToken: verifyImpl });
    controller.sessionRoutes = createSessionRoutes({ authService, sessionCookie: cookie, requireAuth });
  }
  return controller;
}

describe('POST /api/sessions (cookie httpOnly)', () => {
  test('sets helpdesk_token cookie HttpOnly SameSite=Lax on success', async () => {
    const container = buildContainerWith({ loginImpl: async () => ({ token: 'signed-token', user: USER }) });
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'lia@exemplo.local', password: 'correct-password' });

    expect(response.status).toBe(200);
    const setCookie = response.headers['set-cookie'] || [];
    expect(setCookie.join(';')).toMatch(/helpdesk_token=signed-token/);
    expect(setCookie.join(';')).toMatch(/HttpOnly/i);
    expect(setCookie.join(';')).toMatch(/SameSite=Lax/i);
    // Corpo mantém o token (compatibilidade com clientes Bearer).
    expect(response.body.data.token).toBe('signed-token');
  });

  test('skips cookie when sessionCookie is not configured (compat)', async () => {
    const container = {
      sessionRoutes: createSessionRoutes({ authService: { login: async () => ({ token: 't', user: USER }) } }),
    };
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions')
      .send({ email: 'lia@exemplo.local', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});

describe('requireAuth via cookie', () => {
  function buildProbeApp(verifyToken) {
    const app = express();
    app.use(attachCorrelationId);
    app.use(express.json());
    app.get('/protected', createRequireAuth({ verifyToken }), (req, res) => res.status(200).json({ data: req.user }));
    app.use(errorHandler);
    return app;
  }

  test('accepts valid cookie token without Authorization header', async () => {
    const app = buildProbeApp(async (token) => {
      expect(token).toBe('cookie-token');
      return { sub: 'user-1', role: 'requester' };
    });
    const response = await request(app).get('/protected').set('Cookie', 'helpdesk_token=cookie-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 'user-1', role: 'requester' });
  });

  test('prefers Bearer header over cookie', async () => {
    const seen = [];
    const app = buildProbeApp(async (token) => {
      seen.push(token);
      return { sub: 'user-1', role: 'technician' };
    });
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer header-token')
      .set('Cookie', 'helpdesk_token=cookie-token');

    expect(response.status).toBe(200);
    expect(seen).toEqual(['header-token']);
  });

  test('rejects tampered cookie with 401', async () => {
    const app = buildProbeApp(async () => {
      throw new Error('invalid');
    });
    const response = await request(app).get('/protected').set('Cookie', 'helpdesk_token=tampered');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/sessions/logout', () => {
  test('clears the cookie with 200', async () => {
    const container = buildContainerWith({ loginImpl: async () => ({}) });
    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/sessions/logout')
      .set('Cookie', 'helpdesk_token=old');

    expect(response.status).toBe(200);
    expect((response.headers['set-cookie'] || []).join(';')).toMatch(/helpdesk_token=;/);
  });
});

describe('GET /api/sessions/me', () => {
  test('returns id and role from cookie session', async () => {
    const container = buildContainerWith({
      loginImpl: async () => ({}),
      verifyImpl: async () => ({ sub: 'user-1', role: 'admin' }),
    });
    const response = await request(createApp({ corsOrigins: [], container }))
      .get('/api/sessions/me')
      .set('Cookie', 'helpdesk_token=valid');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 'user-1', role: 'admin' });
  });

  test('returns 401 without session', async () => {
    const container = buildContainerWith({
      loginImpl: async () => ({}),
      verifyImpl: async () => {
        throw new Error('invalid');
      },
    });
    const response = await request(createApp({ corsOrigins: [], container })).get('/api/sessions/me');

    expect(response.status).toBe(401);
  });
});
