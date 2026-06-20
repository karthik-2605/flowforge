const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/auth');
const notificationRepo = require('../repositories/notification.repository');
const { success, error } = require('../utilities/responseHelper');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const [items, unreadCount] = await Promise.all([
      notificationRepo.findByUser(userId, { limit, offset }),
      notificationRepo.countUnread(userId),
    ]);

    success(res, { items, unreadCount });
  } catch (err) {
    error(res, err.message, 500);
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    await notificationRepo.markAllRead(req.user.userId);

    success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    error(res, err.message, 500);
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await notificationRepo.markRead(
      req.params.id,
      req.user.userId
    );

    if (!notification) {
      return error(res, 'Notification not found', 404);
    }

    success(res, notification);
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;
