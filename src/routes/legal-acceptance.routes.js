const express = require("express");
const LegalController = require("../controllers/legal.controller");
const isAuth = require("../middlewares/isAuth");
const router = express.Router();

router.get("/", isAuth, LegalController.getHistory);
router.post("/", isAuth, LegalController.acceptDocument);

module.exports = router;
