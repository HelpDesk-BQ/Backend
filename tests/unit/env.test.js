import { loadEnv } from '../../src/config/env.js';

describe('loadEnv', () => {
  test('applies safe defaults for development', () => {
    const env = loadEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5500', 'http://127.0.0.1:5500']);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
    expect(env.BCRYPT_COST).toBe(12);
  });

  test('parses comma-separated origins', () => {
    const env = loadEnv({ CORS_ORIGIN: 'https://app.exemplo.com, https://admin.exemplo.com' });

    expect(env.CORS_ORIGINS).toEqual(['https://app.exemplo.com', 'https://admin.exemplo.com']);
  });

  test('rejects invalid port', () => {
    expect(() => loadEnv({ PORT: 'abc' })).toThrow();
  });

  test('requires database url in production', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow();
  });

  test('requires strong jwt secret in production', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', DATABASE_URL: 'postgres://db:5432/helpdesk', JWT_SECRET: 'short' })
    ).toThrow();
  });

  test('rejects invalid bcrypt cost', () => {
    expect(() => loadEnv({ BCRYPT_COST: '99' })).toThrow();
  });
});
