const express = require("express");
const isAuth = require("../middlewares/isAuth");
const controller = require("../controllers/notification-preferences.controller");

const router = express.Router();

// GET /api/v1/notification-preferences?profile_id=
router.get("/", isAuth, controller.listPreferences);

// PUT /api/v1/notification-preferences
router.put("/", isAuth, controller.upsertPreference);

module.exports = router;
