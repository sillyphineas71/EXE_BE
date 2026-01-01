const { PushDevice } = require("../models/index"); // Import đúng tên từ list bạn gửi
const { Op } = require("sequelize");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const registerDeviceToken = async ({
  userId,
  device_token,
  device_platform,
}) => {
  if (!device_token || !device_platform) {
    throw httpError("device_token và platform là bắt buộc", 400);
  }
  const existingDevice = await PushDevice.findOne({
    where: { device_token },
  });

  if (existingDevice) {
    existingDevice.user_id = userId;
    existingDevice.platform = device_platform;
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

const unregisterDeviceToken = async (deviceId) => {
  if (!deviceId) return;
  await PushDevice.destroy({
    where: { device_token: deviceId },
  });

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
