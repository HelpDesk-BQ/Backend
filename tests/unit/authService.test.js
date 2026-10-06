import { AppError } from '../../src/utils/AppError.js';
import { createAuthService } from '../../src/services/authService.js';

const PASSWORD_HASH = 'hashed-secret';

function buildFakes({ user = null, failures = [], nowValue = new Date('2026-10-05T10:00:00Z') } = {}) {
  const recorded = [];
  const state = {
    recorded,
    compareCalls: 0,
    user: user ?? {
      id: 'user-1',
      name: 'Lia Solicitante',
      email: 'lia@exemplo.local',
      password_hash: PASSWORD_HASH,
      role: 'requester',
      active: true,
    },
  };

  const userRepository = {
    findByEmail: async () => state.user,
  };
  const loginAttemptRepository = {
    record: async (entry) => {
      recorded.push({ ...entry, created_at: nowValue });
      return entry;
    },
    countRecentFailures: async ({ since }) => {
      const all = [...failures, ...recorded.filter((entry) => !entry.success)];
      const recent = all.filter((failure) => failure.created_at >= since);
      return {
        count: recent.length,
        last_failure_at: recent.length ? recent[recent.length - 1].created_at : null,
      };
    },
  };

  const service = createAuthService({
    userRepository,
    loginAttemptRepository,
    comparePassword: async (plain) => {
      state.compareCalls += 1;
      return plain === 'correct-password';
    },
    signToken: async (payload) => `signed:${payload.sub}:${payload.role}`,
    now: () => nowValue,
  });

  return { service, state };
}

function recentFailure(minutesAgo, base = new Date('2026-10-05T10:00:00Z')) {
  return { created_at: new Date(base.getTime() - minutesAgo * 60000) };
}

describe('authService.login', () => {
  test('returns token and public user on valid credentials', async () => {
    const { service } = buildFakes();

    const result = await service.login({ email: 'lia@exemplo.local', password: 'correct-password' });

    expect(result.token).toBe('signed:user-1:requester');
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Lia Solicitante',
      email: 'lia@exemplo.local',
      role: 'requester',
      active: true,
    });
    expect(result.user).not.toHaveProperty('password_hash');
  });

  test('rejects wrong password without revealing details', async () => {
    const { service } = buildFakes();

    const error = await service.login({ email: 'lia@exemplo.local', password: 'wrong' }).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });

  test('rejects unknown email with identical response (no enumeration)', async () => {
    const { service } = buildFakes({ user: null });

    const error = await service.login({ email: 'ghost@exemplo.local', password: 'anything' }).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.message).toBe('Credenciais inválidas.');
  });

  test('locks account on third failure inside window', async () => {
    const { service } = buildFakes({ failures: [recentFailure(4), recentFailure(2)] });

    const error = await service.login({ email: 'lia@exemplo.local', password: 'wrong' }).catch((err) => err);

    expect(error.status).toBe(423);
    expect(error.code).toBe('ACCOUNT_LOCKED');
  });

  test('denies valid password while blocked without checking password', async () => {
    const { service, state } = buildFakes({ failures: [recentFailure(4), recentFailure(3), recentFailure(1)] });

    const error = await service.login({ email: 'lia@exemplo.local', password: 'correct-password' }).catch((err) => err);

    expect(error.status).toBe(423);
    expect(error.code).toBe('ACCOUNT_LOCKED');
    expect(state.compareCalls).toBe(0);
  });

  test('releases lock after block expires', async () => {
    const { service } = buildFakes({ failures: [recentFailure(16), recentFailure(15), recentFailure(14)] });

    const result = await service.login({ email: 'lia@exemplo.local', password: 'correct-password' });

    expect(result.token).toBe('signed:user-1:requester');
  });

  test('ignores failures outside window', async () => {
    const { service } = buildFakes({ failures: [recentFailure(30)] });

    const error = await service.login({ email: 'lia@exemplo.local', password: 'wrong' }).catch((err) => err);

    expect(error.status).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });
});
