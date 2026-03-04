const express = require("express");
const isAuth = require("../middlewares/isAuth");
const MedicationRegimensController = require("../controllers/medication-regimens.controller");

const router = express.Router();

// GET /api/v1/regimens/{regimenId}
router.get(
  "/:regimenId",
  isAuth,
  MedicationRegimensController.getRegimenDetail,
);

//PATCH /api/v1/regimens/{regimenId}
router.patch("/:regimenId", isAuth, MedicationRegimensController.updateRegimen);

//PATCH /api/v1/regimens/{regimenId}/stop
router.patch(
  "/:regimenId/stop",
  isAuth,
  MedicationRegimensController.stopRegimen,
);

module.exports = router;
