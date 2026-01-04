const admin = require("../config/firebase");
const moment = require("moment-timezone");
const {
  PushDevice,
  Notification,
  NotificationPreference,
} = require("../models/index");

/**
 * Hàm kiểm tra xem giờ hiện tại có nằm trong khung giờ yên lặng không
 * @param {string} timezone - Ví dụ: 'Asia/Ho_Chi_Minh'
 * @param {string} startStr - Ví dụ: '22:00:00'
 * @param {string} endStr - Ví dụ: '06:00:00'
 */
const isInQuietHours = (timezone, startStr, endStr) => {
  if (!startStr || !endStr) return false;

  const now = moment().tz(timezone);
  const format = "HH:mm:ss";

  const startTime = moment.tz(
    now.format("YYYY-MM-DD") + " " + startStr,
    "YYYY-MM-DD HH:mm:ss",
    timezone
  );
  const endTime = moment.tz(
    now.format("YYYY-MM-DD") + " " + endStr,
    "YYYY-MM-DD HH:mm:ss",
    timezone
  );

  // Xử lý trường hợp qua đêm (VD: 22:00 hôm nay đến 06:00 sáng mai)
  if (endTime.isBefore(startTime)) {
    return now.isAfter(startTime) || now.isBefore(endTime);
  } else {
    // Trường hợp trong ngày (VD: 12:00 đến 14:00)
    return now.isBetween(startTime, endTime);
  }
};

const processMedicationJob = async (job) => {
  const { userId, profileId, title, body, dataPayload, regimenId } = job.data;
  const logPayload = { title, body, regimen_id: regimenId, ...dataPayload };

  console.log(`Worker processing job for User: ${userId}`);

  try {
    // BƯỚC 1: KIỂM TRA CẤU HÌNH NGƯỜI DÙNG (PREFERENCES)
    let pref = await NotificationPreference.findOne({
      where: { user_id: userId, profile_id: profileId },
    });
    if (!pref) {
      pref = await NotificationPreference.findOne({
        where: { user_id: userId, profile_id: null },
      });
    }
    const allowPush = pref ? pref.allow_push : true;
    const timezone = pref ? pref.timezone : "Asia/Ho_Chi_Minh";
    const quietStart = pref ? pref.quiet_hours_start : null;
    const quietEnd = pref ? pref.quiet_hours_end : null;

    // 1.1 Kiểm tra xem user có tắt thông báo không
    if (!allowPush) {
      console.log(
        `[Worker]  User : ${userId} đã tắt Push Notification. Bỏ qua.`
      );
      // Vẫn lưu log nhưng status là 'cancelled'
      await createLog(
        userId,
        profileId,
        "medication_reminder",
        logPayload,
        "cancelled",
        "User disabled push"
      );
      return;
    }

    if (isInQuietHours(timezone, quietStart, quietEnd)) {
      console.warn(
        `[Worker] Đang trong giờ yên lặng (${quietStart}-${quietEnd}). Bỏ qua.`
      );
      console.log(
        `[Worker] Đang trong giờ yên lặng (${quietStart}-${quietEnd}). Bỏ qua.`
      );
      await createLog(
        userId,
        profileId,
        "medication_reminder",
        logPayload,
        "cancelled",
        "Quiet hours"
      );
      return;
    }

    // BƯỚC 2: LẤY DANH SÁCH THIẾT BỊ
    const devices = await PushDevice.findAll({
      where: { user_id: userId },
      attributes: ["device_token"],
    });

    if (!devices || devices.length === 0) {
      console.log(`[Worker]  User: ${userId} không có thiết bị nào.`);
      await createLog(
        userId,
        profileId,
        "medication_reminder",
        logPayload,
        "failed",
        "No devices found"
      );
      return;
    }

    const tokens = devices.map((d) => d.device_token);

    // BƯỚC 3: GỬI TIN QUA FIREBASE
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: dataPayload || {},
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `[Worker]  Sent: ${response.successCount}, Failed: ${response.failureCount}`
    );

    // BƯỚC 4: XỬ LÝ KẾT QUẢ & LƯU LOG

    // 4.1 Xóa token rác nếu có lỗi
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            failedTokens.push(tokens[idx]);
          }
        }
      });
      if (failedTokens.length > 0) {
        await PushDevice.destroy({ where: { device_token: failedTokens } });
      }
    }

    // 4.2 Lưu log vào bảng notifications
    const status = response.successCount > 0 ? "sent" : "failed";

    await createLog(
      userId,
      profileId,
      "medication_reminder",
      logPayload,
      status,
      null,
      new Date()
    );
  } catch (error) {
    console.error(`[Worker] ❌ Error:`, error);
    await createLog(
      userId,
      profileId,
      "medication_reminder",
      logPayload,
      "failed",
      error.message
    );
    throw error;
  }
};

async function createLog(
  userId,
  profileId,
  type,
  payload,
  status,
  errorMsg,
  sentAt = null
) {
  if (errorMsg) {
    payload.error = errorMsg;
  }

  await Notification.create({
    user_id: userId,
    profile_id: profileId,
    type: type,
    payload: payload,
    status: status,
    sent_at: sentAt,
    created_at: new Date(),
  });
}

module.exports = processMedicationJob;
