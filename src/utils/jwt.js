const jwt = require("jsonwebtoken");
const config = require("../config/env");

const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
    ...options,
  });

const verifyAccessToken = (token) => jwt.verify(token, config.auth.jwtSecret);

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
