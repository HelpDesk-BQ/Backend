export const up = (pgm) => {
  pgm.createTable('tickets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    title: { type: 'varchar(100)', notNull: true },
    description: { type: 'text', notNull: true },
    priority: { type: 'varchar(10)', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'open' },
    requester_id: { type: 'uuid', notNull: true, references: 'users(id)' },
    assignee_id: { type: 'uuid', references: 'users(id)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    deleted_at: { type: 'timestamptz' },
  });
  pgm.addConstraint('tickets', 'tickets_title_check', 'CHECK (char_length(title) >= 10)');
  pgm.addConstraint('tickets', 'tickets_description_check', 'CHECK (char_length(description) >= 30)');
  pgm.addConstraint(
    'tickets',
    'tickets_priority_check',
    "CHECK (priority IN ('low', 'medium', 'high', 'critical'))"
  );
  pgm.addConstraint(
    'tickets',
    'tickets_status_check',
    "CHECK (status IN ('open', 'analysis', 'in_progress', 'resolved', 'closed'))"
  );
  pgm.createIndex('tickets', ['status', 'priority'], { name: 'idx_ticket_filter' });
  pgm.createIndex('tickets', 'requester_id');
  pgm.createIndex('tickets', 'assignee_id');
};

export const down = (pgm) => {
  pgm.dropTable('tickets');
};
