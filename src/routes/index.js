const express = require("express");
const authRoutes = require("./auth.routes");
// const userRoutes = require("./user.routes");
const patientRoutes = require("./patient-profiles.routes");
const regimenRoutes = require("./medication-regimens.routes");
const symptomRoutes = require("./symptom-entry.routes");
const router = express.Router();

router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
router.use("/patient-profiles", patientRoutes);
router.use("/regimens", regimenRoutes);
router.use("/symptoms", symptomRoutes);

module.exports = router;
