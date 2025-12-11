const bcrypt = require("bcryptjs");
const config = require("../config/env");

const hashPassword = async (plainText) => {
  const salt = await bcrypt.genSalt(config.auth.bcryptSaltRounds);
  return bcrypt.hash(plainText, salt);
};

const comparePassword = async (plainText, hash) =>
  bcrypt.compare(plainText, hash);

module.exports = {
  hashPassword,
  comparePassword,
};
