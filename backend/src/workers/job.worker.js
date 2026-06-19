const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { getPool } = require('../config/database');
const { getStrategy } = require('./workerRegistry');

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

    const startTime = Date.now();

    // Strategy Pattern + Factory Pattern
    const strategy = getStrategy(jobType);

    const result = await strategy.execute(payload);

    const duration = Date.now() - startTime;

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

    return result;
  },

  {
    connection: getRedis(),
    concurrency: 5,
  }
);

worker.on('failed', async (job, err) => {
  const pool = getPool();

  try {
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
  } catch (dbError) {
    console.error(
      'Failed to update execution record:',
      dbError.message
    );
  }
});

module.exports = worker;