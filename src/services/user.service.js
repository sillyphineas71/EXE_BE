const { User, Role } = require("../models");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: "role" }],
  });
  if (!user) {
    throw httpError("Không tìm thấy người dùng", 404);
  }
  const u = user.get({ plain: true });
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone_number: u.phone_number || null,
    role: u.role ? u.role.code : null,
    status: u.status,
    created_at: u.created_at,
  };
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
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone_number: u.phone_number || null,
    role: u.role ? u.role.code : null,
    status: u.status,
    created_at: u.created_at,
  };
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
