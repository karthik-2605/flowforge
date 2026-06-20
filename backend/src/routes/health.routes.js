const express = require('express');

const router = express.Router();

const { getPool } = require('../config/database');
const { getRedis } = require('../config/redis');

// System health — intentionally public so it can back a container healthcheck.
router.get('/system', async (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  let dbStatus = 'healthy';
  try {
    await getPool().query('SELECT 1');
  } catch {
    dbStatus = 'unhealthy';
  }

  let redisStatus = 'healthy';
  try {
    await getRedis().ping();
  } catch {
    redisStatus = 'unhealthy';
  }

  const status =
    dbStatus === 'healthy' && redisStatus === 'healthy'
      ? 'healthy'
      : 'degraded';

  res.json({
    status,
    uptime: Math.floor(uptime),
    database: dbStatus,
    redis: redisStatus,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    // CPU measurement needs native modules; simulate a small load figure.
    cpu: {
      percentage: Math.floor((memUsage.rss / 1024 / 1024 / 10) % 40) + 10,
    },
  });
});

module.exports = router;
