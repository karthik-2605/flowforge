const { jobQueue } = require('./queue');

async function scheduleJob(job) {
  const options = {
    jobId: `flowforge-${job.id}`,
  };

  if (job.cron_expression) {
    // Repeatable job
    options.repeat = {
      cron: job.cron_expression,
    };
  } else {
    // One-time immediate job
    options.delay = 0;
  }

  await jobQueue.add(
    `${job.job_type}-${job.id}`,
    {
      jobId: job.id,
      jobType: job.job_type,
      payload: job.payload,
      userId: job.user_id,
      jobName: job.name,
    },
    options
  );

  console.log(
    `Scheduled job: ${job.id} (${job.cron_expression || 'immediate'})`
  );
}

async function pauseJob(job) {
  if (job.cron_expression) {
    const repeatableJobs = await jobQueue.getRepeatableJobs();

    const match = repeatableJobs.find((r) =>
      r.key.includes(job.id)
    );

    if (match) {
      await jobQueue.removeRepeatableByKey(match.key);
    }
  }
}

async function resumeJob(job) {
  await scheduleJob(job);
}

async function loadPersistedJobs() {
  const pool = require('../config/database').getPool();

  const result = await pool.query(
    `
    SELECT *
    FROM jobs
    WHERE status='active'
      AND cron_expression IS NOT NULL
    `
  );

  for (const job of result.rows) {
    await scheduleJob(job).catch(console.error);
  }

  console.log(
    `Re-registered ${result.rows.length} recurring jobs`
  );
}

module.exports = {
  scheduleJob,
  pauseJob,
  resumeJob,
  loadPersistedJobs,
};