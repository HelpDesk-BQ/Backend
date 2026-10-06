import request from 'supertest';
import { createApp } from '../../src/app.js';

const ALLOWED_ORIGIN = 'http://localhost:5500';

describe('application hardening', () => {
  test('sets helmet security headers', async () => {
    const response = await request(createApp({ corsOrigins: [ALLOWED_ORIGIN] })).get('/missing');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  test('blocks origin outside allowlist', async () => {
    const response = await request(createApp({ corsOrigins: [ALLOWED_ORIGIN] }))
      .get('/missing')
      .set('Origin', 'https://evil.test');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('allows origin inside allowlist', async () => {
    const response = await request(createApp({ corsOrigins: [ALLOWED_ORIGIN] }))
      .get('/missing')
      .set('Origin', ALLOWED_ORIGIN);

    expect(response.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  test('rejects payload larger than 100kb', async () => {
    const bigBody = { data: 'a'.repeat(110 * 1024) };
    const response = await request(createApp({ corsOrigins: [ALLOWED_ORIGIN] }))
      .post('/missing')
      .send(bigBody);

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(response.body.error.correlationId).toBeDefined();
  });

  test('rejects malformed json', async () => {
    const response = await request(createApp({ corsOrigins: [ALLOWED_ORIGIN] }))
      .post('/missing')
      .set('Content-Type', 'application/json')
      .send('{"data": broken');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
    expect(response.body.error.correlationId).toBeDefined();
  });
});
