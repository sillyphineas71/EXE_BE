const express = require("express");
const isAuth = require("../middlewares/isAuth");
const patientProfileController = require("../controllers/patient-profiles.controller");
const MedicationRegimensController = require("../controllers/medication-regimens.controller");
const SymptomEntryController = require("../controllers/symptom-entry.controller");

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
//------------------------------
//5. MEDICATION
// POST /api/v1/patient-profiles/{profileId}/regimens
router.post(
  "/:profileId/regimens",
  isAuth,
  MedicationRegimensController.createRegimes
);
// GET /api/v1/patient-profiles/{profileId}/regimens
router.get(
  "/:profileId/regimens",
  isAuth,
  MedicationRegimensController.getRegimensByProfile
);
// GET /api/v1/regimens/{regimenId}
router.get(
  "/:profileId/regimens",
  isAuth,
  MedicationRegimensController.getRegimensByProfile
);
//-----------------------------------
//7.SYMPTOMS

//POST /api/v1/patient-profiles/{profileId}/symptoms
router.post(
  "/:profileId/symptoms",
  isAuth,
  SymptomEntryController.createSymptomEntry
);
//GET /api/v1/patient-profiles/{profileId}/symptoms
router.get(
  "/:profileId/symptoms",
  isAuth,
  SymptomEntryController.getSymptomsByProfile
);
module.exports = router;
