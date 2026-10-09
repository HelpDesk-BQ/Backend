import { parseCookies, expiresInToMs, SESSION_COOKIE_NAME } from '../../src/utils/cookies.js';

describe('cookies', () => {
  test('exposes stable session cookie name', () => {
    expect(SESSION_COOKIE_NAME).toBe('helpdesk_token');
  });

  test('parses cookie header', () => {
    expect(parseCookies('helpdesk_token=abc; other=1')).toEqual({ helpdesk_token: 'abc', other: '1' });
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });

  test.each([
    ['30s', 30000],
    ['5m', 300000],
    ['1h', 3600000],
    ['7d', 604800000],
  ])('converts %s to %d ms', (input, expected) => {
    expect(expiresInToMs(input)).toBe(expected);
  });

  test('rejects invalid expiry format', () => {
    expect(() => expiresInToMs('soon')).toThrow();
    expect(() => expiresInToMs(undefined)).toThrow();
  });
});
