const express = require("express");
const isAuth = require("../middlewares/isAuth");
const patientProfileController = require("../controllers/patient-profiles.controller");

const router = express.Router();

// POST /api/v1/patient-profiles
router.post("/", isAuth, patientProfileController.createPatientProfile);
//GET /api/v1/patient-profiles
router.get("/", isAuth, patientProfileController.getAccessibleProfiles);
//GET /api/v1/patient-profiles/{profileId}
router.get("/:profileId", isAuth, patientProfileController.getProfileDetail);
//PATCH /api/v1/patient-profiles/{profileId}
router.patch("/:profileId", isAuth, patientProfileController.updateProfile);
//DELETE /api/v1/patient-profiles/{profileId}
router.delete("/:profileId", isAuth, patientProfileController.deleteProfile);
module.exports = router;
