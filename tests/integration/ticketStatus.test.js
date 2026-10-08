import request from 'supertest';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';
import { createTicketRoutes } from '../../src/routes/ticket.routes.js';

function allowAs(user) {
  return (req, res, next) => {
    req.user = user;
    next();
  };
}

function buildContainerWith({ ticketService, requireAuth }) {
  return { ticketRoutes: createTicketRoutes({ ticketService, requireAuth }) };
}

const TECHNICIAN = { id: 'tech-1', role: 'technician' };
const REQUESTER = { id: 'user-1', role: 'requester' };

const UPDATED = { id: 'ticket-1', status: 'analysis' };
const COMMENT = { id: 'comment-1', body: 'Verificando.' };

describe('PATCH /api/tickets/:id/status', () => {
  test('technician transitions with 200 and history payload', async () => {
    const container = buildContainerWith({
      ticketService: {
        changeStatus: async () => ({ ticket: UPDATED, comment: null }),
      },
      requireAuth: allowAs(TECHNICIAN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/ticket-1/status')
      .send({ status: 'analysis' });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.status).toBe('analysis');
  });

  test('rejects unknown status with 400', async () => {
    const container = buildContainerWith({
      ticketService: { changeStatus: async () => ({ ticket: UPDATED, comment: null }) },
      requireAuth: allowAs(TECHNICIAN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/ticket-1/status')
      .send({ status: 'banana' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects comment over 1000 chars with 400', async () => {
    const container = buildContainerWith({
      ticketService: { changeStatus: async () => ({ ticket: UPDATED, comment: null }) },
      requireAuth: allowAs(TECHNICIAN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/ticket-1/status')
      .send({ status: 'analysis', comment: 'x'.repeat(1001) });

    expect(response.status).toBe(400);
  });

  test('maps service 403/404/409', async () => {
    const cases = [
      [new AppError(403, 'FORBIDDEN', 'Ação não autorizada.'), 403, 'FORBIDDEN'],
      [new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.'), 404, 'NOT_FOUND'],
      [new AppError(409, 'INVALID_STATE', 'Transição não permitida.'), 409, 'INVALID_STATE'],
    ];
    for (const [thrown, http, code] of cases) {
      const container = buildContainerWith({
        ticketService: {
          changeStatus: async () => {
            throw thrown;
          },
        },
        requireAuth: allowAs(TECHNICIAN),
      });
      const response = await request(createApp({ corsOrigins: [], container }))
        .patch('/api/tickets/ticket-1/status')
        .send({ status: 'analysis' });
      expect(response.status).toBe(http);
      expect(response.body.error.code).toBe(code);
    }
  });

  test('denies requester write at service layer', async () => {
    const container = buildContainerWith({
      ticketService: {
        changeStatus: async () => {
          throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
        },
      },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/ticket-1/status')
      .send({ status: 'analysis' });

    expect(response.status).toBe(403);
  });
});

describe('POST /api/tickets/:id/comments', () => {
  test('creates comment with 201', async () => {
    const container = buildContainerWith({
      ticketService: { addComment: async () => COMMENT },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets/ticket-1/comments')
      .send({ body: 'Verificando.' });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(COMMENT);
  });

  test('rejects empty body with 400', async () => {
    const container = buildContainerWith({
      ticketService: { addComment: async () => COMMENT },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets/ticket-1/comments')
      .send({ body: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('maps forbidden on foreign ticket', async () => {
    const container = buildContainerWith({
      ticketService: {
        addComment: async () => {
          throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
        },
      },
      requireAuth: allowAs(REQUESTER),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .post('/api/tickets/ticket-1/comments')
      .send({ body: 'Oi.' });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/tickets/:id/comments and /history', () => {
  test('lists with 200', async () => {
    const container = buildContainerWith({
      ticketService: {
        listComments: async () => [COMMENT],
        listHistory: async () => [{ id: 'h-1', event: 'status.changed' }],
      },
      requireAuth: allowAs(TECHNICIAN),
    });
    const app = createApp({ corsOrigins: [], container });

    const comments = await request(app).get('/api/tickets/ticket-1/comments');
    const history = await request(app).get('/api/tickets/ticket-1/history');

    expect(comments.status).toBe(200);
    expect(comments.body.data).toEqual([COMMENT]);
    expect(history.status).toBe(200);
    expect(history.body.data).toEqual([{ id: 'h-1', event: 'status.changed' }]);
  });
});
