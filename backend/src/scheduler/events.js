const { QueueEvents } = require('bullmq');
const { getRedis } = require('../config/redis');

// QueueEvents needs its own connection.
const queueEvents = new QueueEvents('job-queue', {
  connection: getRedis(),
});

queueEvents.on('active', ({ jobId }) => {
  console.log(`Worker: job ${jobId} is now active`);
});

queueEvents.on('completed', ({ jobId }) => {
  console.log(`Worker: job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Worker: job ${jobId} failed: ${failedReason}`);
});

queueEvents.on('stalled', ({ jobId }) => {
  console.warn(`Worker: job ${jobId} stalled`);
});

module.exports = { queueEvents };
