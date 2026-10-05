import { query } from '../db/pool.js';
import { normalizeEmail } from './userRepository.js';

export async function record({ userId = null, email, success }, db = { query }) {
  const result = await db.query(
    `INSERT INTO login_attempts (user_id, email, success)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, email, success, created_at`,
    [userId, normalizeEmail(email), success]
  );
  return result.rows[0];
}

export async function countRecentFailures({ email, since }, db = { query }) {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count, MAX(created_at) AS last_failure_at
     FROM login_attempts
     WHERE email = $1 AND success = false AND created_at >= $2`,
    [normalizeEmail(email), since]
  );
  return result.rows[0];
}
