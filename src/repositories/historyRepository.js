import { query } from '../db/pool.js';

const HISTORY_COLUMNS = 'id, ticket_id, actor_id, event, before, after, created_at';

export async function create({ ticketId, actorId, event, before = null, after = null }, db = { query }) {
  const result = await db.query(
    `INSERT INTO ticket_history (ticket_id, actor_id, event, before, after)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${HISTORY_COLUMNS}`,
    [ticketId, actorId, event, before, after]
  );
  return result.rows[0];
}

export async function listByTicket(ticketId, db = { query }) {
  const result = await db.query(
    `SELECT ${HISTORY_COLUMNS} FROM ticket_history WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId]
  );
  return result.rows;
}
