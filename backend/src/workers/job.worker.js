const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { getPool } = require('../config/database');
const { getStrategy } = require('./workerRegistry');
const workerRepo = require('../repositories/worker.repository');

const WORKER_NAME = `worker-${process.pid}`;

// Dedicated connection for publishing (the main one is owned by BullMQ).
const publisher = getRedis().duplicate();

// Track in-flight jobs so heartbeats can report busy vs idle.
let activeCount = 0;

async function publishEvent(event) {
  try {
    await publisher.publish('job-events', JSON.stringify(event));
  } catch (err) {
    console.error('Failed to publish job event:', err.message);
  }
}

const worker = new Worker(
  'job-queue',

  async (job) => {
    const pool = getPool();

    const { jobId, jobType, payload } = job.data;

    activeCount += 1;

    await pool.query(
      `INSERT INTO executions
       (job_id, status, started_at, attempt)
       VALUES ($1, 'running', NOW(), $2)`,
      [jobId, job.attemptsMade + 1]
    );

    console.log(`Processing ${jobType} job: ${jobId}`);

    const startTime = Date.now();

    try {
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

      await workerRepo.incrementProcessed(WORKER_NAME);

      // Observer Pattern — publish completion for the notification service.
      await publishEvent({
        type: 'job_completed',
        jobId,
        userId: job.data.userId,
        jobName: job.data.jobName,
      });

      return result;
    } finally {
      activeCount = Math.max(0, activeCount - 1);
    }
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

    console.error(`Job failed: ${job.data.jobId}`, err.message);

    await publishEvent({
      type: 'job_failed',
      jobId: job.data.jobId,
      userId: job.data.userId,
      jobName: job.data.jobName,
      error: err.message,
    });
  } catch (dbError) {
    console.error('Failed to update execution record:', dbError.message);
  }
});

// Register the worker and start heartbeats.
workerRepo
  .upsert({ name: WORKER_NAME, status: 'idle' })
  .catch((err) => console.error('Worker registration failed:', err.message));

const heartbeat = setInterval(() => {
  workerRepo
    .upsert({
      name: WORKER_NAME,
      status: activeCount > 0 ? 'busy' : 'idle',
    })
    .catch((err) => console.error('Heartbeat failed:', err.message));
}, 10000);

heartbeat.unref?.();

async function shutdown() {
  clearInterval(heartbeat);
  await workerRepo.markOffline(WORKER_NAME).catch(() => {});
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = worker;
