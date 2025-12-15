const userService = require("../services/user.service");

const getMe = async (req, res, next) => {
  try {
    const result = await userService.getCurrentUser(req.user.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { full_name, phone_number } = req.body || {};
    const result = await userService.updateCurrentUser(req.user.id, {
      full_name,
      phone_number,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
};
