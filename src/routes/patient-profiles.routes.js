const express = require("express");
const isAuth = require("../middlewares/isAuth");
const patientProfileController = require("../controllers/patient-profiles.controller");

const router = express.Router();

// POST /api/v1/patient-profiles
router.post("/", isAuth, patientProfileController.createPatientProfile);
module.exports = router;
