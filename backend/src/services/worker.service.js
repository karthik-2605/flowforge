const { jobQueue } = require('../scheduler/queue');
const workerRepo = require('../repositories/worker.repository');

async function getWorkers() {
  return workerRepo.findAll();
}

async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    jobQueue.getWaitingCount(),
    jobQueue.getActiveCount(),
    jobQueue.getCompletedCount(),
    jobQueue.getFailedCount(),
    jobQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

module.exports = {
  getWorkers,
  getQueueStats,
};
