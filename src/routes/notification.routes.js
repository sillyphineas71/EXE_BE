const express = require("express");
const isAuth = require("../middlewares/isAuth");
const notificationController = require("../controllers/notification.controller");

const router = express.Router();

// GET /api/v1/notifications
router.get("/", isAuth, notificationController.listNotifications);

module.exports = router;
