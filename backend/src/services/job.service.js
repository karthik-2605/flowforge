const jobRepository = require("../repositories/job.repository");
const executionRepository = require("../repositories/execution.repository");
const { jobQueue } = require("../scheduler/queue");
const {
  scheduleJob,
  pauseJob: pauseScheduledJob,
  resumeJob: resumeScheduledJob,
} = require("../scheduler/scheduler");

// State Pattern — allowed status transitions for a job.
const VALID_TRANSITIONS = {
  active: ["paused", "deleted"],
  paused: ["active", "deleted"],
  deleted: [],
};

function validateTransition(currentStatus, newStatus) {
  const current = (currentStatus || "active").toLowerCase();
  const allowed = VALID_TRANSITIONS[current] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition job from '${current}' to '${newStatus}'`
    );
  }
}

async function createJob(userId, data) {
  // 1. Save job in PostgreSQL
  const job = await jobRepository.create({
    userId,
    ...data,
  });

  // 2. Add job to BullMQ queue
  await scheduleJob(job);

  return job;
}

async function getJobs(userId, filters) {
  return jobRepository.findAllByUser(userId, filters);
}

async function getJobById(userId, jobId) {
  const job = await jobRepository.findById(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.user_id !== userId) {
    throw new Error("Forbidden");
  }

  return job;
}

async function updateJob(userId, jobId, updates) {
  await getJobById(userId, jobId);

  return jobRepository.update(jobId, updates);
}

async function deleteJob(userId, jobId) {
  const job = await getJobById(userId, jobId);

  validateTransition(job.status, "deleted");

  // Remove from the scheduler before deleting the record.
  await pauseScheduledJob(job);

  await jobRepository.remove(jobId);
}

async function pauseJob(userId, jobId) {
  const job = await getJobById(userId, jobId);

  validateTransition(job.status, "paused");

  await pauseScheduledJob(job);

  return jobRepository.updateStatus(jobId, "paused");
}

async function resumeJob(userId, jobId) {
  const existing = await getJobById(userId, jobId);

  validateTransition(existing.status, "active");

  const job = await jobRepository.updateStatus(jobId, "active");

  await resumeScheduledJob(job);

  return job;
}

/**
 * Manually re-queue a failed execution's job for another run.
 */
async function retryExecution(userId, executionId) {
  const execution = await executionRepository.findById(executionId);

  if (!execution) {
    throw new Error("Execution not found");
  }

  if (execution.status !== "failed") {
    throw new Error("Can only retry failed executions");
  }

  // Ownership check via the parent job.
  const job = await getJobById(userId, execution.job_id);

  await jobQueue.add(
    `${job.job_type}-${job.id}-retry`,
    {
      jobId: job.id,
      jobType: job.job_type,
      payload: job.payload,
      userId: job.user_id,
      jobName: job.name,
    },
    { attempts: 1 }
  );

  return { message: "Job queued for retry" };
}

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
  retryExecution,
  validateTransition,
};
