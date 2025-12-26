const express = require("express");
const isAuth = require("../middlewares/isAuth");
const SymptomEntryController = require("../controllers/symptom-entry.controller");

const router = express.Router();
//GET /api/v1/symptoms/{symptomId}
router.get("/:symptomId", isAuth, SymptomEntryController.getSymptomDetail);
//PATCH /api/v1/symptoms/{symptomId}
router.patch("/:symptomId", isAuth, SymptomEntryController.updateSymptom);
//DELETE /api/v1/symptoms/{symptomId}
router.delete("/:symptomId", isAuth, SymptomEntryController.deleteSymptom);
module.exports = router;
