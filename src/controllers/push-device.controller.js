// const pushDeviceService = require("../services/push-device.service");

// const registerToken = async (req, res, next) => {
//   try {
//     const { device_token, device_platform } = req.body;
//     const userId = req.user.id;

//     const result = await pushDeviceService.registerDeviceToken({
//       userId,
//       device_token,
//       device_platform,
//     });

//     res.status(201).json(result);
//   } catch (error) {
//     next(error);
//   }
// };
// const removeToken = async (req, res, next) => {
//   try {
//     const { deviceId } = req.params;

//     await pushDeviceService.unregisterDeviceToken(deviceId);

//     return res.status(204).send();
//   } catch (error) {
//     next(error);
//   }
// };
// const listDevices = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const devices = await pushDeviceService.getUserDevices(userId);

//     res.status(200).json(devices);
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   registerToken,
//   removeToken,
//   listDevices,
// };

const pushDeviceService = require("../services/push-device.service");

const registerToken = async (req, res, next) => {
  try {
    const { device_token, device_platform } = req.body;
    const userId = req.user.id;

    const result = await pushDeviceService.registerDeviceToken({
      userId,
      device_token,
      device_platform,
    });

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const removeToken = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user.id;

    await pushDeviceService.unregisterDeviceToken({ userId, deviceId });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const listDevices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const devices = await pushDeviceService.getUserDevices(userId);

    return res.status(200).json(devices);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerToken,
  removeToken,
  listDevices,
};
