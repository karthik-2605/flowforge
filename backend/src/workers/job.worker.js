const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { getPool } = require('../config/database');

const worker = new Worker(
  'job-queue',

  async (job) => {
    const pool = getPool();

    const { jobId, jobType, payload } = job.data;

    await pool.query(
      `INSERT INTO executions
       (job_id, status, started_at, attempt)
       VALUES ($1, 'running', NOW(), $2)`,

      [jobId, job.attemptsMade + 1]
    );

    console.log(`Processing ${jobType} job: ${jobId}`);

    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    if (Math.random() < 0.1) {
      throw new Error('Simulated random failure');
    }

    const start = new Date(job.processedOn);

    const duration =
      Date.now() - start.getTime();

    await pool.query(
      `UPDATE executions
       SET status='success',
           completed_at=NOW(),
           duration_ms=$1
       WHERE job_id=$2
         AND status='running'`,

      [duration, jobId]
    );

    await pool.query(
      `UPDATE jobs
       SET last_run_at=NOW()
       WHERE id=$1`,

      [jobId]
    );

    return { success: true };
  },

  {
    connection: getRedis(),
    concurrency: 5,
  }
);

worker.on('failed', async (job, err) => {
  const pool = getPool();

  await pool.query(
    `UPDATE executions
     SET status='failed',
         completed_at=NOW(),
         error_message=$1
     WHERE job_id=$2
       AND status='running'`,

    [err.message, job.data.jobId]
  );

  console.error(
    `Job failed: ${job.data.jobId}`,
    err.message
  );
});

module.exports = worker;