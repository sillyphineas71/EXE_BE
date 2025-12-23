const express = require("express");
const isAuth = require("../middlewares/isAuth");
const MedicationRegimensController = require("../controllers/medication-regimens.controller");

const router = express.Router();

// GET /api/v1/regimens/{regimenId}
router.get(
  "/:regimenId",
  isAuth,
  MedicationRegimensController.getRegimenDetail
);
module.exports = router;
