import { query } from '../db/pool.js';

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

export async function findByEmail(email, db = { query }) {
  const normalized = normalizeEmail(email);
  const result = await db.query(
    'SELECT id, name, email, password_hash, role, active, created_at, updated_at FROM users WHERE email = $1 LIMIT 1',
    [normalized]
  );
  return result.rows[0] || null;
}

export async function findById(id, db = { query }) {
  const result = await db.query(
    'SELECT id, name, email, password_hash, role, active, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

const PUBLIC_USER_COLUMNS = 'id, name, email, role, active, created_at, updated_at';

export async function listUsers({ role } = {}, db = { query }) {
  if (role) {
    const result = await db.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE role = $1 AND active = true ORDER BY name ASC`,
      [role]
    );
    return result.rows;
  }
  const result = await db.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE active = true ORDER BY name ASC`
  );
  return result.rows;
}

export async function create({ name, email, passwordHash, role = 'requester' }, db = { query }) {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password_hash, role, active, created_at, updated_at`,
    [name, normalizeEmail(email), passwordHash, role]
  );
  return result.rows[0];
}
