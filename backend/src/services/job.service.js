const jobRepository = require("../repositories/job.repository");
const { jobQueue } = require("../scheduler/queue");

async function createJob(userId, data) {
  // 1. Save job in PostgreSQL
  const job = await jobRepository.create({
    userId,
    ...data,
  });

  // 2. Add job to BullMQ queue
  await jobQueue.add(
    `${job.job_type}:${job.id}`,
    {
      jobId: job.id,
      jobType: job.job_type,
      payload: job.payload,
    },
    {
      jobId: `flowforge-${job.id}`,
    }
  );

  return job;
}

async function getJobs(userId, filters) {
  return jobRepository.findAllByUser(
    userId,
    filters
  );
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

async function updateJob(
  userId,
  jobId,
  updates
) {
  await getJobById(userId, jobId);

  return jobRepository.update(
    jobId,
    updates
  );
}

async function deleteJob(
  userId,
  jobId
) {
  await getJobById(userId, jobId);

  await jobRepository.remove(jobId);
}

async function pauseJob(
  userId,
  jobId
) {
  await getJobById(userId, jobId);

  return jobRepository.updateStatus(
    jobId,
    "paused"
  );
}

async function resumeJob(
  userId,
  jobId
) {
  await getJobById(userId, jobId);

  return jobRepository.updateStatus(
    jobId,
    "active"
  );
}

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
};