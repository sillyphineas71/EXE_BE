// const express = require("express");
// const PushDeviceController = require("../controllers/push-device.controller");
// const isAuth = require("../middlewares/isAuth");
// const router = express.Router();

// //POST /api/v1/push-devices
// router.post("/", isAuth, PushDeviceController.registerToken);
// //GET /api/v1/push-devices
// router.get("/", isAuth, PushDeviceController.listDevices);
// //DELETE /api/v1/push-devices/{deviceId}
// router.delete("/:deviceId", PushDeviceController.removeToken);

// module.exports = router;

const express = require("express");
const PushDeviceController = require("../controllers/push-device.controller");
const isAuth = require("../middlewares/isAuth");

const router = express.Router();

// POST /api/v1/push-devices
router.post("/", isAuth, PushDeviceController.registerToken);

// GET /api/v1/push-devices
router.get("/", isAuth, PushDeviceController.listDevices);

// DELETE /api/v1/push-devices/{deviceId}
router.delete("/:deviceId", isAuth, PushDeviceController.removeToken);

module.exports = router;
