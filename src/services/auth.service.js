const { User, Role, sequelize } = require("../models");
const { comparePassword } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const login = async ({ email, password }) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw httpError("Email and password are required", 400);
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
    throw httpError("Invalid email or password", 401);
  }

  if (user.status === "disabled") {
    throw httpError("User is disabled", 403);
  }

  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    throw httpError("Invalid email or password", 401);
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

module.exports = {
  login,
};
