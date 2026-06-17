const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const jobService = require('../services/job.service');
const executionRepo = require(
  '../repositories/execution.repository'
);

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({
        error: 'jobId is required',
      });
    }

    await jobService.getJobById(
      req.user.userId,
      jobId
    );

    const executions =
      await executionRepo.findByJobId(jobId);

    res.json(executions);
  } catch (err) {
    console.error(err);

    if (
      err.message === 'Job not found' ||
      err.message === 'Forbidden'
    ) {
      return res.status(
        err.message === 'Forbidden' ? 403 : 404
      ).json({
        error: err.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch executions',
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats =
      await executionRepo.getStats(userId);

    res.json(stats);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Failed to fetch stats',
    });
  }
});

module.exports = router;