const express = require("express");
const LegalController = require("../controllers/legal.controller");

const router = express.Router();

router.get("/", LegalController.getDocuments);
router.post("/ref_sources", LegalController.createRefSources);

module.exports = router;
