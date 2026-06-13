// const { PushDevice } = require("../models/index"); // Import đúng tên từ list bạn gửi
// const { Op } = require("sequelize");

// const httpError = (message, statusCode) => {
//   const error = new Error(message);
//   error.statusCode = statusCode;
//   return error;
// };

// const registerDeviceToken = async ({
//   userId,
//   device_token,
//   device_platform,
// }) => {
//   if (!device_token || !device_platform) {
//     throw httpError("device_token và platform là bắt buộc", 400);
//   }
//   const existingDevice = await PushDevice.findOne({
//     where: { device_token },
//   });

//   if (existingDevice) {
//     existingDevice.user_id = userId;
//     existingDevice.platform = device_platform;
//     existingDevice.last_seen_at = new Date();

//     await existingDevice.save();
//     return existingDevice;
//   }

//   const newDevice = await PushDevice.create({
//     user_id: userId,
//     device_token,
//     device_platform,
//     last_seen_at: new Date(),
//   });

//   return newDevice;
// };

// const unregisterDeviceToken = async (deviceId) => {
//   if (!deviceId) return;
//   await PushDevice.destroy({
//     where: { device_token: deviceId },
//   });

//   return true;
// };

// const getUserDevices = async (userId) => {
//   return await PushDevice.findAll({
//     where: { user_id: userId },
//     order: [["last_seen_at", "DESC"]],
//     attributes: [
//       "id",
//       "user_id",
//       "device_platform",
//       "device_token",
//       "last_seen_at",
//     ],
//   });
// };

// module.exports = {
//   registerDeviceToken,
//   unregisterDeviceToken,
//   getUserDevices,
// };

const { PushDevice } = require("../models/index");
const { Op } = require("sequelize");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Register (or refresh) a device token.
 * If the token already exists, re-assign to the user and update platform/last_seen.
 */
const registerDeviceToken = async ({
  userId,
  device_token,
  device_platform,
}) => {
  if (!device_token || !device_platform) {
    throw httpError("device_token và device_platform là bắt buộc", 400);
  }

  const existingDevice = await PushDevice.findOne({
    where: { device_token },
  });

  if (existingDevice) {
    existingDevice.user_id = userId;
    existingDevice.device_platform = device_platform;
    existingDevice.last_seen_at = new Date();
    await existingDevice.save();
    return existingDevice;
  }

  const newDevice = await PushDevice.create({
    user_id: userId,
    device_token,
    device_platform,
    last_seen_at: new Date(),
  });

  return newDevice;
};

/**
 * Unregister a device.
 * We accept either:
 * - deviceId = PushDevice.id (UUID)
 * - or deviceId = device_token (string)
 * BUT must belong to the authenticated user.
 */
const unregisterDeviceToken = async ({ userId, deviceId }) => {
  if (!deviceId) return true;

  const where = {
    user_id: userId,
    [Op.or]: [{ id: deviceId }, { device_token: deviceId }],
  };

  const count = await PushDevice.destroy({ where });

  if (count === 0) {
    // Don't leak whether a device exists for other users
    throw httpError("Thiết bị không tồn tại hoặc bạn không có quyền", 404);
  }

  return true;
};

const getUserDevices = async (userId) => {
  return await PushDevice.findAll({
    where: { user_id: userId },
    order: [["last_seen_at", "DESC"]],
    attributes: [
      "id",
      "user_id",
      "device_platform",
      "device_token",
      "last_seen_at",
    ],
  });
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  getUserDevices,
};
