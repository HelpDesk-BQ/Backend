import request from 'supertest';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';
import { createTicketRoutes } from '../../src/routes/ticket.routes.js';
import { createReportRoutes } from '../../src/routes/report.routes.js';

function allowAs(user) {
  return (req, res, next) => {
    req.user = user;
    next();
  };
}

const ADMIN = { id: 'admin-1', role: 'admin' };
const TECHNICIAN = { id: 'tech-1', role: 'technician' };

function buildContainerWith({ ticketService, requireAuth }) {
  return {
    ticketRoutes: createTicketRoutes({ ticketService, requireAuth }),
    reportRoutes: createReportRoutes({ ticketService, requireAuth }),
  };
}

describe('DELETE /api/tickets/:id', () => {
  test('admin deletes with 200', async () => {
    const container = buildContainerWith({
      ticketService: { remove: async () => ({ id: 'ticket-1', deleted_at: 'now' }) },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .delete('/api/tickets/ticket-1')
      .send({ justification: 'Duplicado.' });

    expect(response.status).toBe(200);
    expect(response.body.data.deleted_at).toBeDefined();
  });

  test('rejects missing justification with 400', async () => {
    const container = buildContainerWith({
      ticketService: { remove: async () => ({}) },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .delete('/api/tickets/ticket-1')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('maps 403 for non-admin', async () => {
    const container = buildContainerWith({
      ticketService: {
        remove: async () => {
          throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
        },
      },
      requireAuth: allowAs(TECHNICIAN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .delete('/api/tickets/ticket-1')
      .send({ justification: 'x' });

    expect(response.status).toBe(403);
  });
});

describe('PATCH priority/assignee', () => {
  test('changes priority with 200', async () => {
    const container = buildContainerWith({
      ticketService: {
        changePriority: async () => ({ ticket: { id: 't-1', priority: 'critical' }, changed: true }),
        changeAssignee: async () => ({}),
        remove: async () => ({}),
      },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/t-1/priority')
      .send({ priority: 'critical' });

    expect(response.status).toBe(200);
    expect(response.body.data.ticket.priority).toBe('critical');
  });

  test('rejects unknown priority with 400', async () => {
    const container = buildContainerWith({
      ticketService: { changePriority: async () => ({}), changeAssignee: async () => ({}), remove: async () => ({}) },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container }))
      .patch('/api/tickets/t-1/priority')
      .send({ priority: 'urgent' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/reports/summary', () => {
  test('returns totals with 200', async () => {
    const summary = { total: 2, byStatus: { open: 2 }, byPriority: { high: 2 } };
    const container = buildContainerWith({
      ticketService: { getSummary: async () => summary },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/reports/summary');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(summary);
  });

  test('rejects unknown filter with 400', async () => {
    const container = buildContainerWith({
      ticketService: { getSummary: async () => ({}) },
      requireAuth: allowAs(ADMIN),
    });

    const response = await request(createApp({ corsOrigins: [], container })).get('/api/reports/summary?status=nope');

    expect(response.status).toBe(400);
  });
});
