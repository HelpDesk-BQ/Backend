import { AppError } from '../../src/utils/AppError.js';
import { createTicketService } from '../../src/services/ticketService.js';

const BASE = {
  id: 'ticket-1',
  title: 'Computador não inicializa',
  description: 'Ao pressionar o botão, nenhum sinal é exibido no monitor.',
  priority: 'high',
  status: 'open',
  requester_id: 'user-1',
  assignee_id: null,
};

const REQUESTER = { id: 'user-1', role: 'requester' };
const TECHNICIAN = { id: 'tech-1', role: 'technician' };
const ADMIN = { id: 'admin-1', role: 'admin' };

function buildService({ row = BASE, assignee = { id: 'tech-1' } } = {}) {
  const calls = [];
  const ticketRepository = {
    findById: async () => row,
    softDelete: async (id, _db) => {
      calls.push(['softDelete', id]);
      return { ...row, deleted_at: '2026-10-08T00:00:00.000Z' };
    },
    updatePriority: async ({ id, priority }, _db) => {
      calls.push(['updatePriority', { id, priority }]);
      return { ...row, priority };
    },
    updateAssignee: async ({ id, assigneeId }, _db) => {
      calls.push(['updateAssignee', { id, assigneeId }]);
      return { ...row, assignee_id: assigneeId };
    },
    summary: async (args) => {
      calls.push(['summary', args]);
      return { total: 1, byStatus: { open: 1 }, byPriority: { high: 1 } };
    },
  };
  const historyRepository = {
    create: async (input, _db) => {
      calls.push(['history.create', input]);
      return { id: 'h-1', ...input };
    },
  };
  const userRepository = {
    findById: async () => assignee,
  };
  const withTransaction = async (work) => work({});
  const service = createTicketService({ ticketRepository, userRepository, historyRepository, withTransaction });
  return { service, calls };
}

describe('ticketService.remove', () => {
  test('admin deletes with justification and audit', async () => {
    const { service, calls } = buildService();

    const deleted = await service.remove('ticket-1', { justification: 'Duplicado.' }, ADMIN);

    expect(deleted.deleted_at).toBeDefined();
    expect(calls).toContainEqual(['softDelete', 'ticket-1']);
    expect(calls).toContainEqual([
      'history.create',
      { ticketId: 'ticket-1', actorId: 'admin-1', event: 'deleted', before: 'open', after: 'Duplicado.' },
    ]);
  });

  test.each([
    ['requester', REQUESTER],
    ['technician', TECHNICIAN],
  ])('denies %s', async (_label, actor) => {
    const { service } = buildService();

    const error = await service.remove('ticket-1', { justification: 'x' }, actor).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(403);
  });

  test('returns 404 when missing', async () => {
    const { service } = buildService({ row: null });

    const error = await service.remove('missing', { justification: 'x' }, ADMIN).catch((err) => err);

    expect(error.status).toBe(404);
  });
});

describe('ticketService.changePriority/changeAssignee', () => {
  test('technician changes priority with history', async () => {
    const { service, calls } = buildService();

    const result = await service.changePriority('ticket-1', { priority: 'critical' }, TECHNICIAN);

    expect(result).toMatchObject({ changed: true, ticket: { priority: 'critical' } });
    expect(calls).toContainEqual([
      'history.create',
      {
        ticketId: 'ticket-1',
        actorId: 'tech-1',
        event: 'priority.changed',
        before: 'high',
        after: 'critical',
      },
    ]);
  });

  test('same priority returns unchanged without history', async () => {
    const { service, calls } = buildService();

    const result = await service.changePriority('ticket-1', { priority: 'high' }, ADMIN);

    expect(result.changed).toBe(false);
    expect(calls.some(([name]) => name === 'history.create')).toBe(false);
  });

  test('denies requester on priority and assignee', async () => {
    const { service } = buildService();

    const pError = await service.changePriority('ticket-1', { priority: 'low' }, REQUESTER).catch((err) => err);
    const aError = await service.changeAssignee('ticket-1', { assigneeId: 'tech-1' }, REQUESTER).catch((err) => err);

    expect(pError.status).toBe(403);
    expect(aError.status).toBe(403);
  });

  test('assignee change validates user and records history', async () => {
    const { service, calls } = buildService();

    const result = await service.changeAssignee('ticket-1', { assigneeId: 'tech-1' }, ADMIN);

    expect(result.changed).toBe(true);
    expect(result.ticket.assignee_id).toBe('tech-1');
    expect(calls).toContainEqual([
      'history.create',
      {
        ticketId: 'ticket-1',
        actorId: 'admin-1',
        event: 'assignee.changed',
        before: null,
        after: 'tech-1',
      },
    ]);
  });

  test('assignee unknown returns 404', async () => {
    const { service } = buildService({ assignee: null });

    const error = await service.changeAssignee('ticket-1', { assigneeId: 'ghost' }, ADMIN).catch((err) => err);

    expect(error.status).toBe(404);
  });

  test('assignee can be unassigned with null', async () => {
    const assigned = buildService({ row: { ...BASE, assignee_id: 'tech-1' } });

    const result = await assigned.service.changeAssignee('ticket-1', { assigneeId: null }, ADMIN);

    expect(result.ticket.assignee_id).toBeNull();
  });
});

describe('ticketService.getSummary', () => {
  test('requester is scoped to own tickets', async () => {
    const { service, calls } = buildService();

    await service.getSummary({ status: 'open' }, REQUESTER);

    expect(calls[0]).toEqual(['summary', { status: 'open', priority: undefined, requesterId: 'user-1' }]);
  });

  test('admin sees everything', async () => {
    const { service, calls } = buildService();

    await service.getSummary({}, ADMIN);

    expect(calls[0][1]).not.toHaveProperty('requesterId');
  });
});
