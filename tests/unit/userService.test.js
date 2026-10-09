import { AppError } from '../../src/utils/AppError.js';
import { createUserService } from '../../src/services/userService.js';
import * as userRepository from '../../src/repositories/userRepository.js';

const ADMIN = { id: 'admin-1', role: 'admin' };
const TECHNICIAN = { id: 'tech-1', role: 'technician' };
const REQUESTER = { id: 'user-1', role: 'requester' };

function buildFakeDb(handler) {
  return {
    query: async (text, params) => handler(text, params),
  };
}

describe('userService.listUsers', () => {
  test('allows technician and admin', async () => {
    const rows = [{ id: 't-1', role: 'technician' }];
    const service = createUserService({ userRepository: { listUsers: async () => rows } });

    await expect(service.listUsers({}, TECHNICIAN)).resolves.toEqual(rows);
    await expect(service.listUsers({ role: 'technician' }, ADMIN)).resolves.toEqual(rows);
  });

  test('denies requester', async () => {
    const service = createUserService({ userRepository: { listUsers: async () => [] } });

    const error = await service.listUsers({}, REQUESTER).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(403);
  });
});

describe('userRepository.listUsers', () => {
  test('selects public columns only with optional role filter', async () => {
    const rows = [{ id: 't-1', name: 'Rafa', email: 'tecnico@exemplo.local', role: 'technician' }];
    const calls = [];
    const db = buildFakeDb(async (text, params) => {
      calls.push({ text, params });
      return { rows };
    });

    const result = await userRepository.listUsers({ role: 'technician' }, db);

    expect(result).toEqual(rows);
    expect(calls[0].text).toContain('FROM users');
    expect(calls[0].text).not.toMatch(/password_hash/i);
    expect(calls[0].params).toEqual(['technician']);
  });
});
