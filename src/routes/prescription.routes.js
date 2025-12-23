const express = require("express");
const isAuth = require("../middlewares/isAuth");
const prescriptionController = require("../controllers/prescription.controller");

const router = express.Router();

router.post(
  "/patient-profiles/:profileId/prescriptions",
  isAuth,
  prescriptionController.createPrescription
);

module.exports = router;
