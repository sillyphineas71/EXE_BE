const express = require("express");
const isAuth = require("../middlewares/isAuth");
const intakeController = require("../controllers/intake.controller");

const router = express.Router();
router.get(
  "/patient-profiles/:profileId/intake-events/today",
  isAuth,
  intakeController.listTodayIntakeEvents,
);
router.get(
  "/patient-profiles/:profileId/intake-events",
  isAuth,
  intakeController.listIntakeEventsInRange,
);

router.get(
  "/patient-profiles/:profileId/intake-events/summary",
  isAuth,
  intakeController.listIntakeEventsForSummary,
);

router.patch(
  "/intake-events/:intakeEventId",
  isAuth,
  intakeController.updateIntakeEventCheckin,
);

module.exports = router;
