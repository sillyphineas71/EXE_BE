const { Notification, PatientProfile } = require("../models");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Lấy danh sách notifications của user
 * @param {string} userId - ID của user
 * @param {object} query - Query parameters (limit, offset, status, type)
 * @returns {Promise<Array>} - Danh sách notifications
 */
const listNotifications = async (userId, query = {}) => {
  const limit = parseInt(query.limit) || 20;
  const offset = parseInt(query.offset) || 0;

  // Validate limit
  if (limit < 1 || limit > 100) {
    throw httpError("limit phải từ 1 đến 100", 400);
  }

  const where = { user_id: userId };

  // Filter by status
  if (query.status) {
    const validStatuses = ["pending", "sent", "failed", "cancelled"];
    if (!validStatuses.includes(query.status)) {
      throw httpError("status không hợp lệ", 400);
    }
    where.status = query.status;
  }

  // Filter by type
  if (query.type) {
    const validTypes = ["medication_reminder", "system", "other"];
    if (!validTypes.includes(query.type)) {
      throw httpError("type không hợp lệ", 400);
    }
    where.type = query.type;
  }

  // Filter by profile_id
  if (query.profile_id) {
    where.profile_id = query.profile_id;
  }

  const notifications = await Notification.findAll({
    where,
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "full_name"],
        required: false,
      },
    ],
    order: [
      ["created_at", "DESC"],
      ["scheduled_at", "DESC"],
    ],
    limit,
    offset,
  });

  // Get total count for pagination
  const total = await Notification.count({ where });

  return {
    notifications: notifications.map((n) => n.get({ plain: true })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
};

module.exports = {
  listNotifications,
};
