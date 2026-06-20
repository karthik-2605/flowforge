const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/auth');
const workerService = require('../services/worker.service');
const { success, error } = require('../utilities/responseHelper');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const workers = await workerService.getWorkers();

    success(res, workers);
  } catch (err) {
    error(res, err.message, 500);
  }
});

router.get('/queue-stats', async (req, res) => {
  try {
    const stats = await workerService.getQueueStats();

    success(res, stats);
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;
