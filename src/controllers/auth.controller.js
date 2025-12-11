const AuthService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.login(req.body);
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.register(req.body);
    return res.status(201).json({ user, token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  register,
};
