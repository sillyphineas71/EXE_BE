const express = require("express");
const isAuth = require("../middlewares/isAuth");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", isAuth, userController.getMe);
router.patch("/me", isAuth, userController.updateMe);

module.exports = router;
