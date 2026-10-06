import * as userRepository from '../../src/repositories/userRepository.js';
import * as loginAttemptRepository from '../../src/repositories/loginAttemptRepository.js';

function buildFakeDb(handler) {
  const calls = [];
  return {
    calls,
    query: async (text, params) => {
      calls.push({ text, params });
      return handler(text, params);
    },
  };
}

describe('userRepository', () => {
  test('finds user by normalized email with parameterized query', async () => {
    const row = { id: 'user-1', email: 'lia@exemplo.local' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await userRepository.findByEmail('  LIA@exemplo.local ', db);

    expect(result).toEqual(row);
    expect(db.calls[0].params).toEqual(['lia@exemplo.local']);
    expect(db.calls[0].text).toContain('WHERE email = $1');
    expect(db.calls[0].text).not.toContain('LIA@');
  });

  test('returns null when user does not exist', async () => {
    const db = buildFakeDb(async () => ({ rows: [] }));

    await expect(userRepository.findByEmail('ghost@exemplo.local', db)).resolves.toBeNull();
  });

  test('finds user by id with parameterized query', async () => {
    const row = { id: 'user-1', email: 'lia@exemplo.local' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await userRepository.findById('user-1', db);

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('WHERE id = $1');
    expect(db.calls[0].params).toEqual(['user-1']);
  });

  test('creates user with normalized email', async () => {
    const row = { id: 'user-2', email: 'rafa@exemplo.local' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await userRepository.create(
      { name: 'Rafa', email: 'RAFA@exemplo.local', passwordHash: 'hash', role: 'technician' },
      db
    );

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('INSERT INTO users');
    expect(db.calls[0].params).toEqual(['Rafa', 'rafa@exemplo.local', 'hash', 'technician']);
  });
});

describe('loginAttemptRepository', () => {
  test('records attempt and returns row', async () => {
    const row = { id: 'attempt-1', success: false };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await loginAttemptRepository.record({ userId: null, email: 'Ghost@exemplo.local', success: false }, db);

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('INSERT INTO login_attempts');
    expect(db.calls[0].params).toEqual([null, 'ghost@exemplo.local', false]);
  });

  test('counts recent failures with window', async () => {
    const row = { count: 2, last_failure_at: new Date() };
    const db = buildFakeDb(async () => ({ rows: [row] }));
    const since = new Date('2026-10-05T09:55:00Z');

    const result = await loginAttemptRepository.countRecentFailures({ email: 'lia@exemplo.local', since }, db);

    expect(result).toEqual(row);
    expect(db.calls[0].params).toEqual(['lia@exemplo.local', since]);
  });
});
