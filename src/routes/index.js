const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const patientRoutes = require("./patient-profiles.routes");
const drugRoutes = require("./drug.routes");
const prescriptionRoutes = require("./prescription.routes");
const regimenRoutes = require("./medication-regimens.routes");
const symptomRoutes = require("./symptom-entry.routes");
const legalDocumentRoutes = require("./legal.routes");
const legalAcceptanceRoutes = require("./legal-acceptance.routes");
const pushDeviceRoutes = require("./push-device.routes");
const intakeRoutes = require("./intake.routes");
const notificationRoutes = require("./notification.routes");
const notificationPreferencesRoutes = require("./notification-preferences.routes"); // ✅ ADD

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patient-profiles", patientRoutes);
router.use(drugRoutes);
router.use(prescriptionRoutes);
router.use(intakeRoutes);

router.use("/regimens", regimenRoutes);
router.use("/symptoms", symptomRoutes);
router.use("/legal-documents", legalDocumentRoutes);
router.use("/legal-acceptances", legalAcceptanceRoutes);
router.use("/push-devices", pushDeviceRoutes);
router.use("/notifications", notificationRoutes);

// ✅ FIX: mount notification preferences
router.use("/notification-preferences", notificationPreferencesRoutes);

module.exports = router;