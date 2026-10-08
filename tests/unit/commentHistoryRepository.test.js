import * as commentRepository from '../../src/repositories/commentRepository.js';
import * as historyRepository from '../../src/repositories/historyRepository.js';
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

describe('commentRepository', () => {
  test('creates comment with parameterized query', async () => {
    const row = { id: 'c-1', body: 'Verificando.' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await commentRepository.create(
      { ticketId: 't-1', authorId: 'u-1', body: 'Verificando.', isResolution: false },
      db
    );

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('INSERT INTO comments');
    expect(db.calls[0].params).toEqual(['t-1', 'u-1', 'Verificando.', false]);
    expect(db.calls[0].text).not.toContain('Verificando.');
  });

  test('lists comments ordered by creation', async () => {
    const db = buildFakeDb(async () => ({ rows: [] }));

    await commentRepository.listByTicket('t-1', db);

    expect(db.calls[0].text).toContain('WHERE ticket_id = $1');
    expect(db.calls[0].text).toContain('ORDER BY created_at ASC');
  });
});

describe('historyRepository', () => {
  test('creates history event with parameterized query', async () => {
    const row = { id: 'h-1', event: 'status.changed' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await historyRepository.create(
      { ticketId: 't-1', actorId: 'u-2', event: 'status.changed', before: 'open', after: 'analysis' },
      db
    );

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('INSERT INTO ticket_history');
    expect(db.calls[0].params).toEqual(['t-1', 'u-2', 'status.changed', 'open', 'analysis']);
  });
});

describe('ticketRepository.updateStatus', () => {
  test('updates status ignoring deleted rows', async () => {
    const row = { id: 't-1', status: 'analysis' };
    const db = buildFakeDb(async () => ({ rows: [row] }));

    const result = await ticketRepository.updateStatus({ id: 't-1', status: 'analysis' }, db);

    expect(result).toEqual(row);
    expect(db.calls[0].text).toContain('UPDATE tickets SET status = $2');
    expect(db.calls[0].text).toContain('deleted_at IS NULL');
    expect(db.calls[0].params).toEqual(['t-1', 'analysis']);
  });

  test('returns null when ticket is missing or deleted', async () => {
    const db = buildFakeDb(async () => ({ rows: [] }));

    await expect(ticketRepository.updateStatus({ id: 'missing', status: 'analysis' }, db)).resolves.toBeNull();
  });
});
