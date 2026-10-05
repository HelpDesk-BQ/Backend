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

export async function create({ name, email, passwordHash, role = 'requester' }, db = { query }) {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password_hash, role, active, created_at, updated_at`,
    [name, normalizeEmail(email), passwordHash, role]
  );
  return result.rows[0];
}
