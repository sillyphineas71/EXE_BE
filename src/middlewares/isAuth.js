const { verifyAccessToken } = require("../utils/jwt");
const { User, Role } = require("../models");

const unauthorized = (res) => res.status(401).json({ message: "Unauthorized" });

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return unauthorized(res);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, as: "role" }],
    });

    if (!user || user.status === "disabled") {
      return unauthorized(res);
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    return unauthorized(res);
  }
};

module.exports = isAuth;
