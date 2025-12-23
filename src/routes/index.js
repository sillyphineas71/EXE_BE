const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const patientRoutes = require("./patient-profiles.routes");
const drugRoutes = require("./drug.routes");
const prescriptionRoutes = require("./prescription.routes");
const regimenRoutes = require("./medication-regimens.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patient-profiles", patientRoutes);
router.use(drugRoutes);
router.use(prescriptionRoutes);

router.use("/regimens", regimenRoutes);
module.exports = router;
