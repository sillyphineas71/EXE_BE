const AuthService = require("../services/auth.service");

const login = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.login(req.body);
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
};
