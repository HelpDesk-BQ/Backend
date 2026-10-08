import { query } from '../db/pool.js';

const COMMENT_COLUMNS = 'id, ticket_id, author_id, body, is_resolution, created_at';

export async function create({ ticketId, authorId, body, isResolution = false }, db = { query }) {
  const result = await db.query(
    `INSERT INTO comments (ticket_id, author_id, body, is_resolution)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COMMENT_COLUMNS}`,
    [ticketId, authorId, body, isResolution]
  );
  return result.rows[0];
}

export async function listByTicket(ticketId, db = { query }) {
  const result = await db.query(
    `SELECT ${COMMENT_COLUMNS} FROM comments WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId]
  );
  return result.rows;
}
