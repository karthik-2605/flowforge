const { getRedis } = require('../config/redis');
const notificationRepo = require('../repositories/notification.repository');

const TITLE_MAP = {
  job_completed: 'Job Completed',
  job_failed: 'Job Failed',
  retry_success: 'Retry Successful',
  worker_offline: 'Worker Offline',
};

/**
 * Observer Pattern — subscribes to the Redis Pub/Sub channel that workers
 * publish to, and persists a notification for each event.
 */
function startNotificationSubscriber() {
  // A subscriber connection cannot run normal commands, so duplicate.
  const subscriber = getRedis().duplicate();

  subscriber.subscribe('job-events', (err) => {
    if (err) {
      console.error('Redis subscribe error:', err);
    } else {
      console.log('Notification subscriber listening on job-events');
    }
  });

  subscriber.on('message', async (channel, message) => {
    try {
      const event = JSON.parse(message);

      if (!event.userId) {
        return;
      }

      const friendly = (event.type || '').replace(/_/g, ' ');

      const payload = {
        userId: event.userId,
        jobId: event.jobId,
        type: event.type,
        title: TITLE_MAP[event.type] || event.type,
        message:
          event.error || `Job ${event.jobName || event.jobId} ${friendly}`,
      };

      try {
        await notificationRepo.create(payload);
      } catch (err) {
        // Job was deleted while a queued run was still in flight — the FK
        // no longer resolves. Record the notification without the job link.
        if (err.code === '23503') {
          await notificationRepo.create({ ...payload, jobId: null });
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Notification subscriber error:', err.message);
    }
  });

  return subscriber;
}

module.exports = { startNotificationSubscriber };
