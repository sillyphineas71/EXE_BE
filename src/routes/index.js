const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const drugRoutes = require("./drug.routes");
const prescriptionRoutes = require("./prescription.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use(drugRoutes);
router.use(prescriptionRoutes);

module.exports = router;
