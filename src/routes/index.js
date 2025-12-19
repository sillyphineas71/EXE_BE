const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const drugRoutes = require("./drug.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use(drugRoutes);

module.exports = router;
