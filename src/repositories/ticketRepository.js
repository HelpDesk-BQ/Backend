import { query } from '../db/pool.js';

const TICKET_COLUMNS = `id, title, description, priority, status, requester_id, assignee_id,
  created_at, updated_at, deleted_at`;

export async function create({ title, description, priority, requesterId }, db = { query }) {
  const result = await db.query(
    `INSERT INTO tickets (title, description, priority, requester_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${TICKET_COLUMNS}`,
    [title, description, priority, requesterId]
  );
  return result.rows[0];
}

export async function findById(id, db = { query }) {
  const result = await db.query(
    `SELECT ${TICKET_COLUMNS} FROM tickets WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateStatus({ id, status }, db = { query }) {
  const result = await db.query(
    `UPDATE tickets SET status = $2, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${TICKET_COLUMNS}`,
    [id, status]
  );
  return result.rows[0] || null;
}

export async function softDelete(id, db = { query }) {
  const result = await db.query(
    `UPDATE tickets SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${TICKET_COLUMNS}`,
    [id]
  );
  return result.rows[0] || null;
}

function buildFilters({ status, priority, requesterId }) {
  const conditions = ['deleted_at IS NULL'];
  const values = [];
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (priority) {
    values.push(priority);
    conditions.push(`priority = $${values.length}`);
  }
  if (requesterId) {
    values.push(requesterId);
    conditions.push(`requester_id = $${values.length}`);
  }
  return { where: `WHERE ${conditions.join(' AND ')}`, values };
}

export async function list({ status, priority, requesterId, page, limit }, db = { query }) {
  const { where, values } = buildFilters({ status, priority, requesterId });
  const offset = (page - 1) * limit;

  const [countResult, pageResult] = await Promise.all([
    db.query(`SELECT COUNT(*) AS count FROM tickets ${where}`, values),
    db.query(
      `SELECT ${TICKET_COLUMNS} FROM tickets ${where}
       ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
  ]);

  return {
    items: pageResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
  };
}
