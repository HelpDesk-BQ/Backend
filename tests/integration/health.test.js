import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /health', () => {
  test('returns ok without touching database', async () => {
    const response = await request(createApp({ corsOrigins: ['http://localhost:5500'] })).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });
});
