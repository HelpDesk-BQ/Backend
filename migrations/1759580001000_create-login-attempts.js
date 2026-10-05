export const up = (pgm) => {
  pgm.createTable('login_attempts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE' },
    email: { type: 'varchar(255)', notNull: true },
    success: { type: 'boolean', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('login_attempts', ['email', 'created_at']);
  pgm.createIndex('login_attempts', ['user_id', 'created_at']);
};

export const down = (pgm) => {
  pgm.dropTable('login_attempts');
};
