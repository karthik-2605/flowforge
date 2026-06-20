const { getPool } = require('../config/database');

async function findByJobId(jobId, limit = 50) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT *
    FROM executions
    WHERE job_id = $1
    ORDER BY started_at DESC
    LIMIT $2
    `,
    [jobId, limit]
  );

  return result.rows;
}

async function findById(id) {
  const pool = getPool();

  const result = await pool.query(
    'SELECT * FROM executions WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

async function getStats(userId) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE e.status='success') AS success_count,
      COUNT(*) FILTER (WHERE e.status='failed') AS failed_count,
      COUNT(*) FILTER (WHERE e.status='running') AS running_count,
      COUNT(*) AS total_count
    FROM executions e
    JOIN jobs j
      ON e.job_id=j.id
    WHERE j.user_id=$1
    `,
    [userId]
  );

  return result.rows[0];
}

module.exports = {
  findByJobId,
  findById,
  getStats,
};