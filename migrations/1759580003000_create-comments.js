export const up = (pgm) => {
  pgm.createTable('comments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    ticket_id: { type: 'uuid', notNull: true, references: 'tickets(id)', onDelete: 'CASCADE' },
    author_id: { type: 'uuid', notNull: true, references: 'users(id)' },
    body: { type: 'text', notNull: true },
    is_resolution: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint(
    'comments',
    'comments_body_check',
    'CHECK (char_length(body) >= 1 AND char_length(body) <= 1000)'
  );
  pgm.createIndex('comments', ['ticket_id', 'created_at']);
};

export const down = (pgm) => {
  pgm.dropTable('comments');
};
