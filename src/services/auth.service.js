const { User, Role, sequelize } = require("../models");
const { hashPassword, comparePassword } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");
const PatientProfileController = require("./patient-profiles.service");


const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const login = async ({ email, password }) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw httpError("Email và mật khẩu là bắt buộc", 400);
  }

  const emailCondition = sequelize.where(
    sequelize.fn("LOWER", sequelize.col("email")),
    normalizedEmail
  );
  console.log(`email ${email}, password: ${password}`);

  const user = await User.findOne({
    where: emailCondition,
    include: [{ model: Role, as: "role" }],
  });

  if (!user) {
    throw httpError("Email hoặc mật khẩu không đúng", 401);
  }

  if (user.status === "disabled") {
    throw httpError("Tài khoản đã bị khóa", 403);
  }

  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    throw httpError("Email hoặc mật khẩu không đúng", 401);
  }

  const payload = {
    sub: user.id,
    role: user.role ? user.role.code : null,
  };
  const token = signAccessToken(payload);

  const safeUser = user.get({ plain: true });
  delete safeUser.password_hash;

  return {
    user: safeUser,
    token,
  };
};

const register = async ({ email, password, full_name, phone_number }) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const trimmedName = (full_name || "").trim();
  if (!normalizedEmail || !password || !trimmedName) {
    throw httpError("Email, mật khẩu và họ tên là bắt buộc", 400);
  }

  const emailCondition = sequelize.where(
    sequelize.fn("LOWER", sequelize.col("email")),
    normalizedEmail
  );

  const existingUser = await User.findOne({ where: emailCondition });
  if (existingUser) {
    throw httpError("Email đã được sử dụng", 409);
  }

  const defaultRole = await Role.findOne({
    where: { code: "USER" },
  });
  if (!defaultRole) {
    throw httpError("Chưa cấu hình vai trò mặc định", 500);
  }

  const passwordHash = await hashPassword(password);
  const newUser = await User.create({
    email: normalizedEmail,
    password_hash: passwordHash,
    full_name: trimmedName,
    phone_number: phone_number || null,
    role_id: defaultRole.id,
  });

  const result = await PatientProfileController.createPatientProfile(
    newUser.id,
    {
      full_name: newUser.full_name,
      date_of_birth: "2000-01-01",
      sex: "Male",
      relationship_to_owner: "self",
      notes: "",
    },
  );
  
  const createdUser = await User.findByPk(newUser.id, {
    include: [{ model: Role, as: "role" }],
  });

  const payload = {
    sub: createdUser.id,
    role: createdUser.role ? createdUser.role.code : null,
  };
  const token = signAccessToken(payload);

  const safeUser = createdUser.get({ plain: true });
  delete safeUser.password_hash;

  return {
    user: safeUser,
    token,
  };
};

module.exports = {
  login,
  register,
};
