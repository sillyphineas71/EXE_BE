const express = require("express");
const isAuth = require("../middlewares/isAuth");
const prescriptionController = require("../controllers/prescription.controller");

const router = express.Router();

router.post(
  "/patient-profiles/:profileId/prescriptions",
  isAuth,
  prescriptionController.createPrescription
);

router.get(
  "/prescriptions/:prescriptionId",
  isAuth,
  prescriptionController.getPrescriptionById
);

router.post(
  "/prescriptions/:prescriptionId/items",
  isAuth,
  prescriptionController.addPrescriptionItem
);

router.patch(
  "/prescriptions/:prescriptionId/items/:itemId",
  isAuth,
  prescriptionController.updatePrescriptionItem
);

router.delete(
  "/prescriptions/:prescriptionId/items/:itemId",
  isAuth,
  prescriptionController.deletePrescriptionItem
);

module.exports = router;
