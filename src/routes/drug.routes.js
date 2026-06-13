const express = require("express");
const isAuth = require("../middlewares/isAuth");
const drugController = require("../controllers/drug.controller");

const router = express.Router();

router.get("/drug-products", isAuth, drugController.searchDrugProducts);
router.get(
  "/drug-products/:productId",
  isAuth,
  drugController.getDrugProductById
);

router.get("/substances", isAuth, drugController.searchSubstances);
router.get("/substances/:substanceId", isAuth, drugController.getSubstanceById);

module.exports = router;
