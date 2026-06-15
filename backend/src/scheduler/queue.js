const { Queue } = require('bullmq');
const { getRedis } = require('../config/redis');

const jobQueue = new Queue('job-queue', {
  connection: getRedis(),

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: 'exponential',
      delay: 2000,
    },

    removeOnComplete: {
      count: 100,
    },

    removeOnFail: {
      count: 50,
    },
  },
});

module.exports = { jobQueue };