import request from 'supertest';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';
import { createUserRoutes } from '../../src/routes/user.routes.js';

function allowAs(user) {
  return (req, res, next) => {
    req.user = user;
    next();
  };
}

const ADMIN = { id: 'admin-1', role: 'admin' };
const TECHNICIAN = { id: 'tech-1', role: 'technician' };
const REQUESTER = { id: 'user-1', role: 'requester' };

const ROWS = [
  { id: 'tech-1', name: 'Rafa Tecnico', email: 'tecnico@exemplo.local', role: 'technician' },
];

function buildContainerWith({ userService, requireAuth }) {
  return { userRoutes: createUserRoutes({ userService, requireAuth }) };
}

describe('GET /api/users', () => {
  test('technician lists technicians without password hash', async () => {
    let seen = null;
    const container = buildContainerWith({
      userService: {
        listUsers: async (input, requester) => {
          seen = { input, requester };
          return ROWS;
        },
      },
      requireAuth: allowAs(TECHNICIAN),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/users?role=technician');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(ROWS);
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash/i);
    expect(seen.input).toEqual({ role: 'technician' });
  });

  test('rejects unknown role filter with 400', async () => {
    const container = buildContainerWith({
      userService: { listUsers: async () => ROWS },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/users?role=ceo');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('denies requester with 403', async () => {
    const container = buildContainerWith({
      userService: {
        listUsers: async () => {
          throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
        },
      },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/users');

    expect(response.status).toBe(403);
  });
});
