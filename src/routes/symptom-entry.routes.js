const express = require("express");
const isAuth = require("../middlewares/isAuth");
const SymptomEntryController = require("../controllers/symptom-entry.controller");

const router = express.Router();

module.exports = router;
