import { AppError } from '../../src/utils/AppError.js';
import { createTicketService } from '../../src/services/ticketService.js';

const OPEN_TICKET = {
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

function buildService({ row = OPEN_TICKET } = {}) {
  const calls = [];
  const ticketRepository = {
    findById: async (id) => {
      calls.push(['findById', id]);
      return row;
    },
    updateStatus: async ({ id, status }, _db) => {
      calls.push(['updateStatus', { id, status }]);
      return { ...row, status };
    },
  };
  const commentRepository = {
    create: async (input, _db) => {
      calls.push(['comment.create', input]);
      return { id: 'comment-1', ticket_id: row.id, ...input };
    },
    listByTicket: async (ticketId) => {
      calls.push(['comment.list', ticketId]);
      return [];
    },
  };
  const historyRepository = {
    create: async (input, _db) => {
      calls.push(['history.create', input]);
      return { id: 'history-1', ...input };
    },
    listByTicket: async (ticketId) => {
      calls.push(['history.list', ticketId]);
      return [];
    },
  };
  const withTransaction = async (work) => work({});
  const service = createTicketService({ ticketRepository, commentRepository, historyRepository, withTransaction });
  return { service, calls };
}

describe('ticketService.changeStatus', () => {
  test('technician moves open -> analysis with history and no comment row', async () => {
    const { service, calls } = buildService();

    const result = await service.changeStatus('ticket-1', { status: 'analysis' }, TECHNICIAN);

    expect(result.ticket.status).toBe('analysis');
    expect(result.comment).toBeNull();
    expect(calls).toContainEqual([
      'history.create',
      { ticketId: 'ticket-1', actorId: 'tech-1', event: 'status.changed', before: 'open', after: 'analysis' },
    ]);
    expect(calls.some(([name]) => name === 'comment.create')).toBe(false);
  });

  test('optional comment on PATCH becomes comment row marked as resolution when closing flow', async () => {
    const { service, calls } = buildService({
      row: { ...OPEN_TICKET, status: 'resolved' },
    });

    const result = await service.changeStatus(
      'ticket-1',
      { status: 'closed', comment: 'Reiniciado e validado com o solicitante.' },
      ADMIN
    );

    expect(result.ticket.status).toBe('closed');
    expect(result.comment.body).toBe('Reiniciado e validado com o solicitante.');
    expect(calls).toContainEqual([
      'comment.create',
      {
        ticketId: 'ticket-1',
        authorId: 'admin-1',
        body: 'Reiniciado e validado com o solicitante.',
        isResolution: true,
      },
    ]);
  });

  test('rejects invalid jump open -> closed with INVALID_STATE', async () => {
    const { service } = buildService();

    const error = await service.changeStatus('ticket-1', { status: 'closed', comment: 'x' }, TECHNICIAN).catch((err) => err);

    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE');
  });

  test('rejects resolved -> closed without comment', async () => {
    const { service } = buildService({ row: { ...OPEN_TICKET, status: 'resolved' } });

    for (const comment of [undefined, '', '   ']) {
      const error = await service.changeStatus('ticket-1', { status: 'closed', comment }, ADMIN).catch((err) => err);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('RESOLUTION_COMMENT_REQUIRED');
    }
  });

  test('denies requester on status change (read-only)', async () => {
    const { service } = buildService();

    const error = await service.changeStatus('ticket-1', { status: 'analysis' }, REQUESTER).catch((err) => err);

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  test('denies technician on closed ticket (out of queue)', async () => {
    const { service } = buildService({ row: { ...OPEN_TICKET, status: 'closed' } });

    const error = await service
      .changeStatus('ticket-1', { status: 'in_progress' }, TECHNICIAN)
      .catch((err) => err);

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  test('returns 404 when ticket does not exist', async () => {
    const { service } = buildService({ row: null });

    const error = await service.changeStatus('missing', { status: 'analysis' }, ADMIN).catch((err) => err);

    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('ticketService.addComment', () => {
  test('owner requester can comment and records history', async () => {
    const { service, calls } = buildService();

    const comment = await service.addComment('ticket-1', { body: 'Segue anexo do erro.' }, REQUESTER);

    expect(comment.body).toBe('Segue anexo do erro.');
    expect(calls).toContainEqual([
      'history.create',
      {
        ticketId: 'ticket-1',
        actorId: 'user-1',
        event: 'comment.added',
        before: null,
        after: 'Segue anexo do erro.',
      },
    ]);
  });

  test('denies other requester and technician on closed ticket', async () => {
    const { service } = buildService();
    const closedService = buildService({ row: { ...OPEN_TICKET, status: 'closed' } }).service;

    const otherError = await service.addComment('ticket-1', { body: 'oi' }, OTHER_REQUESTER).catch((err) => err);
    expect(otherError.code).toBe('FORBIDDEN');

    const techError = await closedService.addComment('ticket-1', { body: 'oi' }, TECHNICIAN).catch((err) => err);
    expect(techError.code).toBe('FORBIDDEN');
  });

  test('allows technician and admin on open ticket', async () => {
    const { service } = buildService();

    await expect(service.addComment('ticket-1', { body: 'Verificando.' }, TECHNICIAN)).resolves.toMatchObject({
      body: 'Verificando.',
    });
    await expect(service.addComment('ticket-1', { body: 'Ok.' }, ADMIN)).resolves.toMatchObject({ body: 'Ok.' });
  });
});

describe('ticketService.listComments/listHistory', () => {
  test('enforces same visibility as detail', async () => {
    const { service } = buildService();

    await expect(service.listComments('ticket-1', REQUESTER)).resolves.toEqual([]);
    await expect(service.listHistory('ticket-1', REQUESTER)).resolves.toEqual([]);

    const error = await service.listComments('ticket-1', OTHER_REQUESTER).catch((err) => err);
    expect(error.code).toBe('FORBIDDEN');
  });
});
