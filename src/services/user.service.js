const { User, Role } = require("../models");
const { buildSubscriptionInfo } = require("./subscription.service");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toCurrentUserResponse = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  phone_number: u.phone_number || null,
  role: u.role ? u.role.code : null,
  status: u.status,
  account_tier: u.account_tier || "free",
  premium_plan_code: u.premium_plan_code || null,
  premium_expires_at: u.premium_expires_at || null,
  subscription: buildSubscriptionInfo(u),
  created_at: u.created_at,
});

const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: "role" }],
  });
  if (!user) {
    throw httpError("Không tìm thấy người dùng", 404);
  }

  const u = user.get({ plain: true });
  return toCurrentUserResponse(u);
};

const updateCurrentUser = async (userId, { full_name, phone_number }) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: "role" }],
  });
  if (!user) {
    throw httpError("Không tìm thấy người dùng", 404);
  }

  const updates = {};
  if (typeof full_name === "string") {
    const name = full_name.trim();
    if (!name) {
      throw httpError("Họ tên không được để trống", 400);
    }
    updates.full_name = name;
  }
  if (typeof phone_number !== "undefined") {
    updates.phone_number = phone_number || null;
  }

  if (Object.keys(updates).length === 0) {
    throw httpError("Không có dữ liệu để cập nhật", 400);
  }

  updates.updated_at = new Date();
  await user.update(updates);

  await user.reload({ include: [{ model: Role, as: "role" }] });
  const u = user.get({ plain: true });

  return toCurrentUserResponse(u);
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};