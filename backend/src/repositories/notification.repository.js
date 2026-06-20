const { getPool } = require('../config/database');

async function create({ userId, jobId, type, title, message }) {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO notifications (user_id, job_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, jobId || null, type, title, message]
  );

  return result.rows[0];
}

async function findByUser(userId, { limit = 50, offset = 0 } = {}) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

async function countUnread(userId) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT COUNT(*) AS count
     FROM notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );

  return parseInt(result.rows[0].count, 10);
}

async function markRead(id, userId) {
  const pool = getPool();

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );

  return result.rows[0] || null;
}

async function markAllRead(userId) {
  const pool = getPool();

  await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
}

module.exports = {
  create,
  findByUser,
  countUnread,
  markRead,
  markAllRead,
};
