// const express = require("express");
// const isAuth = require("../middlewares/isAuth");
// const prescriptionController = require("../controllers/prescription.controller");

// const router = express.Router();

// router.get(
//   "/patient-profiles/:profileId/prescriptions",
//   isAuth,
//   prescriptionController.listPrescriptionsByProfile,
// );

// router.post(
//   "/patient-profiles/:profileId/prescriptions",
//   isAuth,
//   prescriptionController.createPrescription
// );

// router.get(
//   "/prescriptions/:prescriptionId",
//   isAuth,
//   prescriptionController.getPrescriptionById
// );

// router.patch(
//   "/prescriptions/:prescriptionId",
//   isAuth,
//   prescriptionController.updatePrescription
// );

// router.post(
//   "/prescriptions/:prescriptionId/items",
//   isAuth,
//   prescriptionController.addPrescriptionItem
// );

// router.patch(
//   "/prescriptions/:prescriptionId/items/:itemId",
//   isAuth,
//   prescriptionController.updatePrescriptionItem
// );

// router.delete(
//   "/prescriptions/:prescriptionId/items/:itemId",
//   isAuth,
//   prescriptionController.deletePrescriptionItem
// );

// module.exports = router;


const express = require("express");
const isAuth = require("../middlewares/isAuth");
const prescriptionController = require("../controllers/prescription.controller");

const router = express.Router();

// ================================
// Prescriptions (by profile)
// ================================

router.get(
  "/patient-profiles/:profileId/prescriptions",
  isAuth,
  prescriptionController.listPrescriptionsByProfile,
);

router.post(
  "/patient-profiles/:profileId/prescriptions",
  isAuth,
  prescriptionController.createPrescription,
);

router.get(
  "/prescriptions/:prescriptionId",
  isAuth,
  prescriptionController.getPrescriptionById,
);

router.patch(
  "/prescriptions/:prescriptionId",
  isAuth,
  prescriptionController.updatePrescription,
);

// ================================
// Prescription items
// ================================

router.post(
  "/prescriptions/:prescriptionId/items",
  isAuth,
  prescriptionController.addPrescriptionItem,
);

router.patch(
  "/prescriptions/:prescriptionId/items/:itemId",
  isAuth,
  prescriptionController.updatePrescriptionItem,
);

router.delete(
  "/prescriptions/:prescriptionId/items/:itemId",
  isAuth,
  prescriptionController.deletePrescriptionItem,
);

// Backward-compatible endpoints used by FE (phase 1 fix)
router.patch(
  "/prescription-items/:itemId",
  isAuth,
  prescriptionController.updatePrescriptionItemById,
);

router.delete(
  "/prescription-items/:itemId",
  isAuth,
  prescriptionController.deletePrescriptionItemById,
);

// ================================
// Prescription files (phase 2: manual entry only)
// - We only support DELETE record for now.
// ================================

router.delete(
  "/prescription-files/:fileId",
  isAuth,
  prescriptionController.deletePrescriptionFileById,
);

module.exports = router;
