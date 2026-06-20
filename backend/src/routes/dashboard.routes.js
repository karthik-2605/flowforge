const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/auth');
const dashboardService = require('../services/dashboard.service');
const { success, error } = require('../utilities/responseHelper');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData(req.user.userId);

    success(res, data);
  } catch (err) {
    error(res, err.message, 500);
  }
});

router.get('/trends', async (req, res) => {
  try {
    const data = await dashboardService.getTrends(req.user.userId);

    success(res, data);
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;
