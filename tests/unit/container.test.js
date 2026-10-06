import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import * as pool from '../../src/db/pool.js';
import { buildContainer } from '../../src/container.js';

const TEST_ENV = { JWT_SECRET: 'test-secret-with-at-least-32-chars-0123456789', JWT_EXPIRES_IN: '1h' };

describe('pool', () => {
  afterEach(async () => {
    await pool.closePool();
  });

  test('delegates queries to injected pool and closes it', async () => {
    const fake = {
      query: async (text, params) => ({ rows: [{ text, params }] }),
      end: async () => {},
    };
    pool.setPool(fake);

    const result = await pool.query('SELECT $1', ['ok']);

    expect(result.rows).toEqual([{ text: 'SELECT $1', params: ['ok'] }]);
  });

  test('creates lazy pool without connecting', async () => {
    pool.setPool(null);
    const created = pool.getPool();

    expect(created).toBeDefined();
    expect(typeof created.query).toBe('function');
  });
});

describe('container', () => {
  test('wires session routes and auth middleware with real jwt roundtrip', async () => {
    const container = buildContainer(TEST_ENV);
    expect(container.authService).toBeDefined();
    expect(container.sessionRoutes).toBeDefined();

    const token = jwt.sign({ sub: 'user-1', role: 'technician' }, TEST_ENV.JWT_SECRET, { expiresIn: '1h' });
    const app = express();
    app.get('/protected', container.requireAuth, (req, res) => res.status(200).json({ data: req.user }));

    const allowed = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toEqual({ id: 'user-1', role: 'technician' });

    const denied = await request(app).get('/protected').set('Authorization', 'Bearer tampered');
    expect(denied.status).toBe(401);
  });
});
