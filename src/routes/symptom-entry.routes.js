const express = require("express");
const isAuth = require("../middlewares/isAuth");
const SymptomEntryController = require("../controllers/symptom-entry.controller");

const router = express.Router();
//GET /api/v1/symptoms/{symptomId}
router.get("/:symptomId", isAuth, SymptomEntryController.getSymptomDetail);
module.exports = router;
