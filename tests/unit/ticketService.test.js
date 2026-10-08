import { AppError } from '../../src/utils/AppError.js';
import { createTicketService } from '../../src/services/ticketService.js';

const ROW = {
  id: 'ticket-1',
  title: 'Computador não inicializa',
  description: 'Ao pressionar o botão, nenhum sinal é exibido no monitor.',
  priority: 'high',
  status: 'open',
  requester_id: 'user-1',
  assignee_id: null,
};

const REQUESTER = { id: 'user-1', role: 'requester' };
const OTHER_REQUESTER = { id: 'user-9', role: 'requester' };
const TECHNICIAN = { id: 'tech-1', role: 'technician' };
const ADMIN = { id: 'admin-1', role: 'admin' };

function buildService({ row = ROW, listResult = { items: [ROW], total: 1, page: 1, limit: 20 } } = {}) {
  const calls = [];
  const ticketRepository = {
    create: async (input) => {
      calls.push(['create', input]);
      return { ...ROW, ...input, requester_id: input.requesterId };
    },
    findById: async () => row,
    list: async (args) => {
      calls.push(['list', args]);
      return { ...listResult, ...args };
    },
  };
  return { service: createTicketService({ ticketRepository }), calls };
}

describe('ticketService.create', () => {
  test('delegates with requester id from caller', async () => {
    const { service, calls } = buildService();

    const result = await service.create(
      { title: ROW.title, description: ROW.description, priority: 'high' },
      REQUESTER
    );

    expect(calls[0]).toEqual([
      'create',
      { title: ROW.title, description: ROW.description, priority: 'high', requesterId: 'user-1' },
    ]);
    expect(result.requester_id).toBe('user-1');
  });
});

describe('ticketService.list', () => {
  test('requester only sees own tickets', async () => {
    const { service, calls } = buildService();

    await service.list({ status: 'open', page: 1, limit: 20 }, REQUESTER);

    expect(calls[0][1]).toMatchObject({ status: 'open', requesterId: 'user-1' });
  });

  test('technician sees queue without owner restriction', async () => {
    const { service, calls } = buildService();

    await service.list({ status: 'open', page: 1, limit: 20 }, TECHNICIAN);

    expect(calls[0][1]).toMatchObject({ status: 'open' });
    expect(calls[0][1]).not.toHaveProperty('requesterId');
  });

  test.each([
    [{ page: 0, limit: 20 }, { page: 1, limit: 20 }],
    [{ page: -3, limit: 20 }, { page: 1, limit: 20 }],
    [{ page: 1, limit: 500 }, { page: 1, limit: 100 }],
    [{ page: 'x', limit: 'y' }, { page: 1, limit: 20 }],
  ])('normalizes %p to %p', async (input, expected) => {
    const { service, calls } = buildService();

    await service.list(input, ADMIN);

    expect(calls[0][1]).toMatchObject(expected);
  });
});

describe('ticketService.getById', () => {
  test.each([
    ['owner', REQUESTER],
    ['technician on open ticket', TECHNICIAN],
    ['admin', ADMIN],
  ])('allows %s', async (_label, actor) => {
    const { service } = buildService();

    const result = await service.getById('ticket-1', actor);

    expect(result).toEqual(ROW);
  });

  test('returns 404 when ticket does not exist', async () => {
    const { service } = buildService({ row: null });

    const error = await service.getById('missing', ADMIN).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  test('denies requester on another user ticket', async () => {
    const { service } = buildService();

    const error = await service.getById('ticket-1', OTHER_REQUESTER).catch((err) => err);

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  test('denies technician on closed ticket', async () => {
    const { service } = buildService({ row: { ...ROW, status: 'closed' } });

    const error = await service.getById('ticket-1', TECHNICIAN).catch((err) => err);

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});
