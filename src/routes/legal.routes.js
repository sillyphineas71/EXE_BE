const express = require("express");
const LegalController = require("../controllers/legal.controller");

const router = express.Router();

router.get("/", LegalController.getDocuments);

module.exports = router;
