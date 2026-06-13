const notificationService = require("../services/notification.service");

/**
 * GET /api/v1/notifications
 * Lấy danh sách notifications của user hiện tại
 */
const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.listNotifications(userId, req.query);

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
};
