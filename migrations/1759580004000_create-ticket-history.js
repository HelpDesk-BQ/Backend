export const up = (pgm) => {
  pgm.createTable('ticket_history', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    ticket_id: { type: 'uuid', notNull: true, references: 'tickets(id)', onDelete: 'CASCADE' },
    actor_id: { type: 'uuid', notNull: true, references: 'users(id)' },
    event: { type: 'varchar(50)', notNull: true },
    before: { type: 'text' },
    after: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('ticket_history', ['ticket_id', 'created_at']);
};

export const down = (pgm) => {
  pgm.dropTable('ticket_history');
};
