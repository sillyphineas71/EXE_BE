const express = require("express");
const authRoutes = require("./auth.routes");
<<<<<<< Updated upstream
=======
const userRoutes = require("./user.routes");
const patientRoutes = require("./patient-profiles.routes");
>>>>>>> Stashed changes

const router = express.Router();

router.use("/auth", authRoutes);
<<<<<<< Updated upstream
=======
router.use("/users", userRoutes);
router.use("/patient-profiles", patientRoutes);
>>>>>>> Stashed changes

module.exports = router;
