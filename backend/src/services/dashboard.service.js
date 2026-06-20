const { getPool } = require('../config/database');
const { getQueueStats } = require('./worker.service');

async function getDashboardData(userId) {
  const pool = getPool();

  const [jobStats, execStats, recentActivity, queueStats] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total_jobs,
         COUNT(*) FILTER (WHERE status = 'active') AS active_jobs,
         COUNT(*) FILTER (WHERE status = 'paused') AS paused_jobs
       FROM jobs
       WHERE user_id = $1`,
      [userId]
    ),

    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE e.status = 'success') AS success_count,
         COUNT(*) FILTER (WHERE e.status = 'failed') AS failed_count,
         COUNT(*) AS total_count
       FROM executions e
       JOIN jobs j ON e.job_id = j.id
       WHERE j.user_id = $1
         AND e.started_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    ),

    pool.query(
      `SELECT e.*, j.name AS job_name, j.job_type
       FROM executions e
       JOIN jobs j ON e.job_id = j.id
       WHERE j.user_id = $1
       ORDER BY e.started_at DESC
       LIMIT 10`,
      [userId]
    ),

    getQueueStats(),
  ]);

  const totalExec = parseInt(execStats.rows[0].total_count, 10) || 0;
  const successCount = parseInt(execStats.rows[0].success_count, 10) || 0;
  const successRate =
    totalExec === 0 ? '0.0' : ((successCount / totalExec) * 100).toFixed(1);

  return {
    jobs: jobStats.rows[0],
    executions: execStats.rows[0],
    successRate,
    recentActivity: recentActivity.rows,
    queue: queueStats,
  };
}

async function getTrends(userId) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT
       date_trunc('hour', e.started_at) AS hour,
       COUNT(*) FILTER (WHERE e.status = 'success') AS success,
       COUNT(*) FILTER (WHERE e.status = 'failed') AS failed
     FROM executions e
     JOIN jobs j ON e.job_id = j.id
     WHERE j.user_id = $1
       AND e.started_at > NOW() - INTERVAL '24 hours'
     GROUP BY hour
     ORDER BY hour`,
    [userId]
  );

  return result.rows.map((row) => ({
    hour: new Date(row.hour).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    success: parseInt(row.success, 10),
    failed: parseInt(row.failed, 10),
  }));
}

module.exports = {
  getDashboardData,
  getTrends,
};
