import * as ticketRepository from '../../src/repositories/ticketRepository.js';

function buildFakeDb(handler) {
  const calls = [];
  return {
    calls,
    query: async (text, params) => {
      calls.push({ text, params });
      return handler(text, params);
    },
  };
}

const ROW = {
  id: 'ticket-1',
  title: 'Computador não inicializa',
  description: 'Ao pressionar o botão, nenhum sinal é exibido no monitor.',
  priority: 'high',
  status: 'open',
  requester_id: 'user-1',
  assignee_id: null,
};

describe('ticketRepository', () => {
  test('creates ticket with requester id and parameterized query', async () => {
    const db = buildFakeDb(async () => ({ rows: [ROW] }));

    const result = await ticketRepository.create(
      { title: ROW.title, description: ROW.description, priority: 'high', requesterId: 'user-1' },
      db
    );

    expect(result).toEqual(ROW);
    expect(db.calls[0].text).toContain('INSERT INTO tickets');
    expect(db.calls[0].params).toEqual([ROW.title, ROW.description, 'high', 'user-1']);
    expect(db.calls[0].text).not.toContain('user-1');
  });

  test('finds visible ticket by id', async () => {
    const db = buildFakeDb(async () => ({ rows: [ROW] }));

    const result = await ticketRepository.findById('ticket-1', db);

    expect(result).toEqual(ROW);
    expect(db.calls[0].text).toContain('WHERE id = $1');
    expect(db.calls[0].text).toContain('deleted_at IS NULL');
  });

  test('returns null when ticket does not exist', async () => {
    const db = buildFakeDb(async () => ({ rows: [] }));

    await expect(ticketRepository.findById('missing', db)).resolves.toBeNull();
  });

  test('lists with filters and pagination', async () => {
    const db = buildFakeDb(async (text) =>
      text.startsWith('SELECT COUNT') ? { rows: [{ count: '2' }] } : { rows: [ROW] }
    );

    const result = await ticketRepository.list(
      { status: 'open', priority: 'high', requesterId: 'user-1', page: 2, limit: 10 },
      db
    );

    expect(result).toEqual({ items: [ROW], total: 2, page: 2, limit: 10 });
    const [countCall, pageCall] = db.calls;
    expect(countCall.text).toContain('status = $1');
    expect(pageCall.text).toContain('ORDER BY created_at DESC');
    expect(pageCall.params).toEqual(['open', 'high', 'user-1', 10, 10]);
  });

  test('lists without filters', async () => {
    const db = buildFakeDb(async (text) =>
      text.startsWith('SELECT COUNT') ? { rows: [{ count: '0' }] } : { rows: [] }
    );

    const result = await ticketRepository.list({ page: 1, limit: 20 }, db);

    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20 });
    expect(db.calls[0].text).not.toMatch(/status =|priority =|requester_id =/);
    expect(db.calls[0].text).toContain('deleted_at IS NULL');
  });
});
