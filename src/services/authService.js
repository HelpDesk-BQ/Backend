import { AppError } from '../utils/AppError.js';

export const DEFAULT_LOCK = { maxAttempts: 3, windowMinutes: 5, blockMinutes: 10 };

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active };
}

export function createAuthService({
  userRepository,
  loginAttemptRepository,
  comparePassword,
  signToken,
  now = () => new Date(),
  lock = DEFAULT_LOCK,
}) {
  async function findActiveLock(email, currentTime) {
    const windowStart = new Date(currentTime.getTime() - lock.windowMinutes * 60000);
    const failures = await loginAttemptRepository.countRecentFailures({ email, since: windowStart });
    if (failures.count < lock.maxAttempts || !failures.last_failure_at) {
      return { locked: false, failures };
    }
    const blockUntil = new Date(new Date(failures.last_failure_at).getTime() + lock.blockMinutes * 60000);
    return { locked: currentTime < blockUntil, failures };
  }

  async function login({ email, password }) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const currentTime = now();

    const { locked } = await findActiveLock(normalizedEmail, currentTime);
    if (locked) {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Acesso temporariamente indisponível.');
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    const passwordMatches = user && user.active ? await comparePassword(password, user.password_hash) : false;

    if (!passwordMatches) {
      await loginAttemptRepository.record({ userId: user ? user.id : null, email: normalizedEmail, success: false });
      const { locked: lockedAfterFailure } = await findActiveLock(normalizedEmail, currentTime);
      if (lockedAfterFailure) {
        throw new AppError(423, 'ACCOUNT_LOCKED', 'Acesso temporariamente indisponível.');
      }
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas.');
    }

    await loginAttemptRepository.record({ userId: user.id, email: normalizedEmail, success: true });
    const token = await signToken({ sub: user.id, role: user.role });
    return { token, user: toPublicUser(user) };
  }

  return { login };
}
