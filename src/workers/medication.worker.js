// const admin = require("../config/firebase");
// const moment = require("moment-timezone");
// const { getMessaging } = require("firebase-admin/messaging");
// const {
//   PushDevice,
//   Notification,
//   NotificationPreference,
// } = require("../models/index");

// /**
//  * Hàm kiểm tra xem giờ hiện tại có nằm trong khung giờ yên lặng không
//  * @param {string} timezone - Ví dụ: 'Asia/Ho_Chi_Minh'
//  * @param {string} startStr - Ví dụ: '22:00:00'
//  * @param {string} endStr - Ví dụ: '06:00:00'
//  */
// const isInQuietHours = (timezone, startStr, endStr) => {
//   if (!startStr || !endStr) return false;

//   const now = moment().tz(timezone);
//   const format = "HH:mm:ss";

//   const startTime = moment.tz(
//     now.format("YYYY-MM-DD") + " " + startStr,
//     "YYYY-MM-DD HH:mm:ss",
//     timezone,
//   );
//   const endTime = moment.tz(
//     now.format("YYYY-MM-DD") + " " + endStr,
//     "YYYY-MM-DD HH:mm:ss",
//     timezone,
//   );

//   // Xử lý trường hợp qua đêm (VD: 22:00 hôm nay đến 06:00 sáng mai)
//   if (endTime.isBefore(startTime)) {
//     return now.isAfter(startTime) || now.isBefore(endTime);
//   } else {
//     // Trường hợp trong ngày (VD: 12:00 đến 14:00)
//     return now.isBetween(startTime, endTime);
//   }
// };

// const processMedicationJob = async (job) => {
//   const { userId, profileId, title, body, dataPayload, regimenId } = job.data;
//   const logPayload = { title, body, regimen_id: regimenId, ...dataPayload };

//   console.log(`Worker processing job for User: ${userId}`);

//   try {
//     // BƯỚC 1: KIỂM TRA CẤU HÌNH NGƯỜI DÙNG (PREFERENCES)
//     let pref = await NotificationPreference.findOne({
//       where: { user_id: userId, profile_id: profileId },
//     });
//     if (!pref) {
//       pref = await NotificationPreference.findOne({
//         where: { user_id: userId, profile_id: null },
//       });
//     }
//     const allowPush = pref ? pref.allow_push : true;
//     const timezone = pref ? pref.timezone : "Asia/Ho_Chi_Minh";
//     const quietStart = pref ? pref.quiet_hours_start : null;
//     const quietEnd = pref ? pref.quiet_hours_end : null;

//     // 1.1 Kiểm tra xem user có tắt thông báo không
//     if (!allowPush) {
//       console.log(
//         `[Worker]  User : ${userId} đã tắt Push Notification. Bỏ qua.`,
//       );
//       // Vẫn lưu log nhưng status là 'cancelled'
//       await createLog(
//         userId,
//         profileId,
//         "medication_reminder",
//         logPayload,
//         "cancelled",
//         "User disabled push",
//       );
//       return;
//     }

//     if (isInQuietHours(timezone, quietStart, quietEnd)) {
//       console.warn(
//         `[Worker] Đang trong giờ yên lặng (${quietStart}-${quietEnd}). Bỏ qua.`,
//       );
//       console.log(
//         `[Worker] Đang trong giờ yên lặng (${quietStart}-${quietEnd}). Bỏ qua.`,
//       );
//       await createLog(
//         userId,
//         profileId,
//         "medication_reminder",
//         logPayload,
//         "cancelled",
//         "Quiet hours",
//       );
//       return;
//     }

//     // BƯỚC 2: LẤY DANH SÁCH THIẾT BỊ
//     const devices = await PushDevice.findAll({
//       where: { user_id: userId },
//       attributes: ["device_token"],
//     });

//     if (!devices || devices.length === 0) {
//       console.log(`[Worker]  User: ${userId} không có thiết bị nào.`);
//       await createLog(
//         userId,
//         profileId,
//         "medication_reminder",
//         logPayload,
//         "failed",
//         "No devices found",
//       );
//       return;
//     }

//     const tokens = devices.map((d) => d.device_token);

//     // BƯỚC 3: GỬI TIN QUA FIREBASE
//     const message = {
//       notification: {
//         title: title,
//         body: body,
//       },
//       data: dataPayload || {},
//       tokens: tokens,
//     };

//     // const response = await admin.messaging().sendEachForMulticast(message);

//     const messaging = getMessaging(admin.app());
//     const response = await messaging.sendEachForMulticast(message);
//     if (response.failureCount > 0) {
//       console.log("Worker and Firebase is Failler :", response);
//     }

//     console.log(
//       `[Worker]  Sent: ${response.successCount}, Failed: ${response.failureCount}`,
//     );

//     // BƯỚC 4: XỬ LÝ KẾT QUẢ & LƯU LOG

//     // 4.1 Xóa token rác nếu có lỗi
//     if (response.failureCount > 0) {
//       const failedTokens = [];
//       response.responses.forEach((resp, idx) => {
//         if (!resp.success) {
//           const code = resp.error.code;
//           if (
//             code === "messaging/invalid-registration-token" ||
//             code === "messaging/registration-token-not-registered"
//           ) {
//             failedTokens.push(tokens[idx]);
//           }
//         }
//       });
//       if (failedTokens.length > 0) {
//         await PushDevice.destroy({ where: { device_token: failedTokens } });
//       }
//     }

//     // 4.2 Lưu log vào bảng notifications
//     const status = response.successCount > 0 ? "sent" : "failed";

//     await createLog(
//       userId,
//       profileId,
//       "medication_reminder",
//       logPayload,
//       status,
//       null,
//       new Date(),
//     );
//   } catch (error) {
//     console.error(`[Worker] ❌ Error:`, error);
//     await createLog(
//       userId,
//       profileId,
//       "medication_reminder",
//       logPayload,
//       "failed",
//       error.message,
//     );
//     throw error;
//   }
// };

// async function createLog(
//   userId,
//   profileId,
//   type,
//   payload,
//   status,
//   errorMsg,
//   sentAt = null,
// ) {
//   if (errorMsg) {
//     payload.error = errorMsg;
//   }

//   await Notification.create({
//     user_id: userId,
//     profile_id: profileId,
//     type: type,
//     payload: payload,
//     status: status,
//     sent_at: sentAt,
//     created_at: new Date(),
//   });
// }

// module.exports = processMedicationJob;

const admin = require("../config/firebase");
const moment = require("moment-timezone");
const { getMessaging } = require("firebase-admin/messaging");
const {
  PushDevice,
  Notification,
  NotificationPreference,
} = require("../models/index");

/**
 * Quiet hours check (fix qua đêm):
 * - Nếu end < start => endTime = endTime + 1 day
 * - Nếu now < startTime (trước 22:00) thì so với endTime của ngày mai sẽ sai,
 *   nên dùng interval [startTime, endTime(+1d)] và nếu now trước startTime thì +1d cho now.
 */
const isInQuietHours = (timezone, startStr, endStr) => {
  if (!startStr || !endStr) return false;

  const now = moment().tz(timezone);
  const day = now.format("YYYY-MM-DD");

  let startTime = moment.tz(
    `${day} ${startStr}`,
    "YYYY-MM-DD HH:mm:ss",
    timezone,
  );
  let endTime = moment.tz(`${day} ${endStr}`, "YYYY-MM-DD HH:mm:ss", timezone);

  // Qua đêm: 22:00 -> 06:00
  if (endTime.isSameOrBefore(startTime)) {
    endTime = endTime.add(1, "day");

    // Nếu now < startTime (ví dụ 01:00), thì nó thuộc “ngày hôm sau”
    // nên +1 day cho now để so đúng range [22:00, 06:00+1d]
    const nowAdjusted = now.clone();
    if (nowAdjusted.isBefore(startTime)) nowAdjusted.add(1, "day");

    return nowAdjusted.isBetween(startTime, endTime, null, "[)");
  }

  // Trong ngày: 12:00 -> 14:00
  return now.isBetween(startTime, endTime, null, "[)");
};

// FCM data: value nên là string
const normalizeDataPayload = (payload) => {
  if (!payload || typeof payload !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") out[k] = v;
    else out[k] = JSON.stringify(v); // an toàn cho number/boolean/object
  }
  return out;
};

const processMedicationJob = async (job) => {
  const {
    userId,
    profileId,
    title,
    body,
    dataPayload,
    regimenId,
    // khuyến nghị: bạn nên truyền thêm 2 field này từ scheduler:
    timezone: jobTimezone,
    scheduledAt, // ISO string hoặc timestamp
  } = job.data;

  const safeData = normalizeDataPayload(dataPayload);

  const logPayload = {
    title,
    body,
    regimen_id: regimenId,
    ...safeData,
  };

  console.log(
    `[Worker] processing job for user=${userId}, profile=${profileId}, regimen=${regimenId}`,
  );

  try {
    // 1) Load preferences (ưu tiên profile-specific)
    let pref = await NotificationPreference.findOne({
      where: { user_id: userId, profile_id: profileId },
    });

    if (!pref) {
      pref = await NotificationPreference.findOne({
        where: { user_id: userId, profile_id: null },
      });
    }

    const allowPush = pref ? pref.allow_push : true;

    // TIMEZONE: ưu tiên timezone từ job (regimen) -> rồi mới tới pref -> default
    const timezone =
      jobTimezone || (pref ? pref.timezone : null) || "Asia/Ho_Chi_Minh";
    const quietStart = pref ? pref.quiet_hours_start : null;
    const quietEnd = pref ? pref.quiet_hours_end : null;

    // 1.1 user tắt push
    if (!allowPush) {
      console.log(`[Worker] user=${userId} disabled push -> cancelled`);
      await createLog({
        userId,
        profileId,
        type: "medication_reminder",
        payload: logPayload,
        status: "cancelled",
        errorMsg: "User disabled push",
        scheduledAt,
        sentAt: null,
      });
      return;
    }

    // 1.2 quiet hours
    if (isInQuietHours(timezone, quietStart, quietEnd)) {
      console.warn(
        `[Worker] quiet hours (${quietStart}-${quietEnd}) tz=${timezone} -> cancelled`,
      );
      await createLog({
        userId,
        profileId,
        type: "medication_reminder",
        payload: logPayload,
        status: "cancelled",
        errorMsg: "Quiet hours",
        scheduledAt,
        sentAt: null,
      });
      return;
    }

    // 2) Get device tokens
    const devices = await PushDevice.findAll({
      where: { user_id: userId },
      attributes: ["device_token"],
    });

    if (!devices || devices.length === 0) {
      console.log(`[Worker] user=${userId} no devices -> failed`);
      await createLog({
        userId,
        profileId,
        type: "medication_reminder",
        payload: logPayload,
        status: "failed",
        errorMsg: "No devices found",
        scheduledAt,
        sentAt: null,
      });
      return;
    }

    const tokens = devices.map((d) => d.device_token);

    // 3) Send FCM (set priority + apns để giảm delay)
    const message = {
      tokens,
      notification: { title, body },
      data: safeData,

      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "medication_reminder", // nhớ tạo channel bên Android app
        },
      },

      apns: {
        headers: {
          "apns-priority": "10",
          // iOS 13+ nên có push type, nếu app bạn dùng đúng APNS token/FCM iOS:
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    };

    const messaging = getMessaging(admin.app());
    const response = await messaging.sendEachForMulticast(message);

    console.log(
      `[Worker] FCM result: sent=${response.successCount}, failed=${response.failureCount}`,
    );

    // 4) Cleanup invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          console.warn(
            `[Worker] token failed idx=${idx} code=${code} msg=${resp.error?.message}`,
          );

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
        console.log(`[Worker] removed ${failedTokens.length} invalid tokens`);
      }
    }

    // 5) Log DB
    const status = response.successCount > 0 ? "sent" : "failed";
    const sentAt = new Date(); // thời điểm worker gửi thật

    await createLog({
      userId,
      profileId,
      type: "medication_reminder",
      payload: logPayload,
      status,
      errorMsg: response.failureCount > 0 ? "Some tokens failed" : null,
      scheduledAt,
      sentAt,
    });
  } catch (error) {
    console.error(`[Worker] ❌ error:`, error);
    await createLog({
      userId,
      profileId,
      type: "medication_reminder",
      payload: logPayload,
      status: "failed",
      errorMsg: error.message,
      scheduledAt,
      sentAt: null,
    });
    throw error;
  }
};

async function createLog({
  userId,
  profileId,
  type,
  payload,
  status,
  errorMsg,
  scheduledAt,
  sentAt = null,
}) {
  const finalPayload = { ...payload };
  if (errorMsg) finalPayload.error = errorMsg;

  await Notification.create({
    user_id: userId,
    profile_id: profileId,
    type,
    payload: finalPayload,
    status,
    // nếu bảng có scheduled_at thì lưu (ảnh bạn chụp có cột này)
    scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
    sent_at: sentAt,
    created_at: new Date(),
  });
}

module.exports = processMedicationJob;
