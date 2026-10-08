import request from 'supertest';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';
import { createTicketRoutes } from '../../src/routes/ticket.routes.js';

const ROW = {
  id: 'ticket-1',
  title: 'Computador não inicializa',
  description: 'Ao pressionar o botão, nenhum sinal é exibido no monitor.',
  priority: 'high',
  status: 'open',
  requester_id: 'user-1',
  assignee_id: null,
};

function allowAs(user) {
  return (req, res, next) => {
    req.user = user;
    next();
  };
}

function denyAll(req, res, next) {
  next(new AppError(401, 'UNAUTHORIZED', 'Autenticação necessária.'));
}

function buildContainerWith({ ticketService, requireAuth }) {
  return { ticketRoutes: createTicketRoutes({ ticketService, requireAuth }) };
}

const REQUESTER = { id: 'user-1', role: 'requester' };

describe('POST /api/tickets', () => {
  test('creates valid ticket with 201 and owner from token', async () => {
    let received = null;
    const container = buildContainerWith({
      ticketService: {
        create: async (input, requester) => {
          received = { input, requester };
          return ROW;
        },
      },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets')
      .send({ title: ROW.title, description: ROW.description, priority: 'high' });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('open');
    expect(received.requester.id).toBe('user-1');
    expect(received.input).not.toHaveProperty('requesterId');
    expect(received.input).not.toHaveProperty('requester_id');
  });

  test('rejects short title with 400', async () => {
    const container = buildContainerWith({
      ticketService: { create: async () => ROW },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets')
      .send({ title: 'curto', description: ROW.description, priority: 'high' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects extra fields with 400', async () => {
    const container = buildContainerWith({
      ticketService: { create: async () => ROW },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets')
      .send({ title: ROW.title, description: ROW.description, priority: 'high', requester_id: 'user-9' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('requires authentication', async () => {
    const container = buildContainerWith({
      ticketService: { create: async () => ROW },
      requireAuth: denyAll,
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets')
      .send({ title: ROW.title, description: ROW.description, priority: 'high' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/tickets', () => {
  test('returns paginated list', async () => {
    const page = { items: [ROW], total: 1, page: 1, limit: 20 };
    const container = buildContainerWith({
      ticketService: { list: async () => page },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get(
      '/api/tickets?status=open&priority=high'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(page);
  });

  test('rejects unknown status filter with 400', async () => {
    const container = buildContainerWith({
      ticketService: { list: async () => ({ items: [], total: 0, page: 1, limit: 20 }) },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/tickets?status=banana');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/tickets/:id', () => {
  test('returns ticket detail', async () => {
    const container = buildContainerWith({
      ticketService: { getById: async () => ROW },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/tickets/ticket-1');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(ROW);
  });

  test('maps service 404 and 403', async () => {
    const notFoundContainer = buildContainerWith({
      ticketService: {
        getById: async () => {
          throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
        },
      },
      requireAuth: allowAs(REQUESTER),
    });
    const forbiddenContainer = buildContainerWith({
      ticketService: {
        getById: async () => {
          throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
        },
      },
      requireAuth: allowAs(REQUESTER),
    });

    const notFound = await request(createApp({ corsOrigins: [], container: notFoundContainer })).get(
      '/api/tickets/missing'
    );
    const forbidden = await request(createApp({ corsOrigins: [], container: forbiddenContainer })).get(
      '/api/tickets/ticket-1'
    );

    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('NOT_FOUND');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
  });
});

describe('ticket error envelope', () => {
  test('every ticket error carries correlation id', async () => {
    const container = buildContainerWith({
      ticketService: { create: async () => ROW },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets')
      .send({ title: 'x', description: 'y', priority: 'nope' });

    expect(response.body.error.correlationId).toBeDefined();
    expect(response.headers['x-correlation-id']).toBe(response.body.error.correlationId);
    expect(JSON.stringify(response.body)).not.toMatch(/stack|select/i);
  });
});
