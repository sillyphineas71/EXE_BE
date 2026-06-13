
// const moment = require("moment-timezone");
// const medicationQueue = require("../queues/medication.queue");

// /**
//  * Hủy tất cả reminder jobs của 1 regimen (Bull removeJobs theo pattern)
//  */
// async function cancelRemindersForRegimen(regimenId) {
//   if (!regimenId) return;
//   // Bull (v3/v4) hỗ trợ removeJobs(pattern)
//   await medicationQueue.removeJobs(`remind-${regimenId}-*`);
// }

// /**
//  * CORE LOGIC: Lên lịch nhắc nhở cho 1 đơn thuốc (Regimen)
//  * Được gọi bởi:
//  * 1) Cron đầu ngày
//  * 2) API khi user tạo/sửa đơn thuốc
//  */
// const scheduleRemindersForRegimen = async (regimen, { resetExisting = true } = {}) => {
//   try {
//     if (!regimen) return;

//     if (regimen.is_active === false) {
//       console.log(`[Scheduler] Regimen ${regimen.id} inactive -> skip`);
//       // nếu inactive mà vẫn muốn dọn job cũ:
//       if (resetExisting) await cancelRemindersForRegimen(regimen.id);
//       return;
//     }

//     const tz = regimen.timezone || "Asia/Ho_Chi_Minh";
//     const now = moment().tz(tz);
//     const endOfDay = now.clone().endOf("day");

//     // DATE fields có thể bị lệch khi parse, nên ép theo tz + start/end of day
//     if (regimen.start_date) {
//       const start = moment.tz(moment(regimen.start_date).format("YYYY-MM-DD"), "YYYY-MM-DD", tz).startOf("day");
//       if (start.isAfter(now)) {
//         console.log(`[Scheduler] Regimen ${regimen.id} not started yet`);
//         return;
//       }
//     }

//     if (regimen.end_date) {
//       const end = moment.tz(moment(regimen.end_date).format("YYYY-MM-DD"), "YYYY-MM-DD", tz).endOf("day");
//       if (end.isBefore(now)) {
//         console.log(`[Scheduler] Regimen ${regimen.id} expired`);
//         // hết hạn thì dọn job cũ
//         if (resetExisting) await cancelRemindersForRegimen(regimen.id);
//         return;
//       }
//     }

//     // ✅ Quan trọng: update thì phải cancel lịch cũ rồi lên lịch mới
//     if (resetExisting) {
//       await cancelRemindersForRegimen(regimen.id);
//     }

//     if (regimen.schedule_type === "fixed_times") {
//       await handleFixedTimes(regimen, now, endOfDay, tz);
//     } else if (regimen.schedule_type === "interval_hours") {
//       console.log(`[Scheduler] interval_hours not supported yet`);
//     } else {
//       console.log(`[Scheduler] Unknown schedule_type: ${regimen.schedule_type}`);
//     }
//   } catch (error) {
//     console.error(`[Scheduler] ❌ Error scheduling Regimen ${regimen?.id}:`, error);
//   }
// };

// const handleFixedTimes = async (regimen, now, endOfDay, tz) => {
//   const payload = regimen.schedule_payload || {};
//   const times = payload.times;

//   if (!times || !Array.isArray(times) || times.length === 0) return;

//   const doseInfo = regimen.total_daily_dose
//     ? `${parseFloat(regimen.total_daily_dose)} ${regimen.dose_unit || ""}`.trim()
//     : "theo chỉ định";

//   for (const timeStr of times) {
//     const [hourStr, minuteStr] = String(timeStr).split(":");
//     const hour = parseInt(hourStr, 10);
//     const minute = parseInt(minuteStr, 10);

//     // ✅ Dùng now.clone() để chắc chắn “ngày hôm nay theo tz”
//     const targetTime = now.clone().set({
//       hour,
//       minute,
//       second: 0,
//       millisecond: 0,
//     });

//     // chỉ schedule các giờ còn lại trong ngày
//     if (targetTime.isAfter(now) && targetTime.isBefore(endOfDay)) {
//       const delay = targetTime.diff(now);

//       await medicationQueue.add(
//         {
//           userId: regimen.created_by_user_id,
//           profileId: regimen.profile_id,
//           regimenId: regimen.id,
//           title: `⏰ Nhắc nhở uống thuốc`,
//           body: `Đã đến giờ uống thuốc: ${regimen.display_name}. Số lượng: ${doseInfo}`,
//           dataPayload: {
//             screen: "RegimenDetail",
//             id: regimen.id,
//           },
//           // ✅ thêm field này để debug giờ dự kiến
//           scheduledAt: targetTime.toISOString(),
//           scheduledAtLocal: targetTime.format("YYYY-MM-DD HH:mm:ss"),
//           tz,
//         },
//         {
//           delay,
//           jobId: `remind-${regimen.id}-${targetTime.unix()}`,
//           removeOnComplete: true,
//           attempts: 3,
//           backoff: { type: "exponential", delay: 5000 },
//         }
//       );

//       console.log(`[Scheduler] scheduled ${regimen.id} @ ${targetTime.format("HH:mm")} ${tz}`);
//     }
//   }
// };

// module.exports = {
//   scheduleRemindersForRegimen,
//   cancelRemindersForRegimen,
// };

const moment = require("moment-timezone");
const medicationQueue = require("../queues/medication.queue");
const { PatientProfile } = require("../models");
const { getDrugProductById } = require("./drug.service");

const parseDateOnlyInTz = (value, tz, mode) => {
  if (!value) return null;

  // DATEONLY từ Sequelize/Postgres thường là 'YYYY-MM-DD'
  const s = String(value);

  let m;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    m = moment.tz(s, "YYYY-MM-DD", tz);
  } else {
    // fallback cho trường hợp value là Date/ISO datetime
    m = moment(value).tz(tz);
  }

  return mode === "end" ? m.endOf("day") : m.startOf("day");
};

/**
 * Theo business rule hiện tại của bạn:
 * - Push reminder chỉ gửi về thiết bị của ACCOUNT sở hữu hồ sơ (owner_user_id)
 * - KHÔNG gửi theo profile, KHÔNG gửi cho patient profile riêng biệt
 *
 * Nếu không resolve được owner, fallback về created_by_user_id để tránh mất reminder.
 */
const resolveReminderTargetUserId = async (regimen) => {
  if (!regimen?.profile_id) return regimen?.created_by_user_id || null;

  try {
    const profile = await PatientProfile.findByPk(regimen.profile_id, {
      attributes: ["id", "owner_user_id"],
    });
    return profile?.owner_user_id || regimen?.created_by_user_id || null;
  } catch (e) {
    console.warn(
      `[Scheduler] resolveReminderTargetUserId fallback for regimen ${regimen?.id}:`,
      e?.message || e,
    );
    return regimen?.created_by_user_id || null;
  }
};

/**
 * Cancel delayed reminder jobs for a regimen for TODAY (based on times array).
 * This is important when user updates schedule, to avoid firing old reminders.
 */
const cancelRemindersForRegimenTimes = async ({
  regimenId,
  times,
  timezone,
}) => {
  try {
    if (!regimenId) return;
    if (!Array.isArray(times) || times.length === 0) return;

    const tz = timezone || "Asia/Ho_Chi_Minh";

    for (const timeStr of times) {
      try {
        const [hour, minute] = String(timeStr).split(":");
        const targetTime = moment()
          .tz(tz)
          .set({
            hour: parseInt(hour),
            minute: parseInt(minute),
            second: 0,
            millisecond: 0,
          });

        const jobId = `remind-${regimenId}-${targetTime.unix()}`;
        const job = await medicationQueue.getJob(jobId);
        if (job) {
          await job.remove();
        }
      } catch (_) {
        // ignore per-time errors
      }
    }
  } catch (e) {
    console.warn(
      "[Scheduler] cancelRemindersForRegimenTimes error:",
      e?.message || e,
    );
  }
};

/**
 * CORE LOGIC: Lên lịch nhắc nhở cho 1 đơn thuốc (Regimen)
 */
const scheduleRemindersForRegimen = async (regimen) => {
  try {
    if (!regimen) return;

    if (regimen.is_active === false) {
      console.log(`[Scheduler] Regimen ${regimen.id} đã bị vô hiệu hóa.`);
      return;
    }

    const tz = regimen.timezone || "Asia/Ho_Chi_Minh";

    const now = moment().tz(tz);
    const endOfDay = moment().tz(tz).endOf("day");

    const startDay = parseDateOnlyInTz(regimen.start_date, tz, "start");
    if (startDay && startDay.isAfter(now)) {
      console.log(`[Scheduler] Regimen ${regimen.id} chưa đến ngày bắt đầu.`);
      return;
    }

    const endDay = parseDateOnlyInTz(regimen.end_date, tz, "end");
    if (endDay && endDay.isBefore(now)) {
      console.log(`[Scheduler] Regimen ${regimen.id} đã hết hạn.`);
      return;
    }

    if (regimen.schedule_type === "fixed_times") {
      await handleFixedTimes(regimen, now, endOfDay, tz);
    } else {
      console.log(
        `[Scheduler] Loại lịch '${regimen.schedule_type}' chưa hỗ trợ lúc này.`,
      );
    }
  } catch (error) {
    console.error(
      `[Scheduler] ❌ Lỗi khi lên lịch cho Regimen ${regimen.id}:`,
      error,
    );
  }
};

/**
 * Logic xử lý cho kiểu lịch 'fixed_times'
 */
const handleFixedTimes = async (regimen, now, endOfDay, tz) => {
  const payload = regimen.schedule_payload || {};
  const times = payload.times;

  if (!times || !Array.isArray(times) || times.length === 0) {
    return;
  }

  const doseInfo = regimen.total_daily_dose
    ? `${parseFloat(regimen.total_daily_dose)} ${
        regimen.dose_unit || ""
      }`.trim()
    : "theo chỉ định";

  const reminderUserId = await resolveReminderTargetUserId(regimen);
  if (!reminderUserId) {
    console.warn(
      `[Scheduler] Regimen ${regimen?.id} không xác định được user nhận push`,
    );
    return;
  }

  for (const timeStr of times) {
    const [hour, minute] = String(timeStr).split(":");
    const targetTime = moment()
      .tz(tz)
      .set({
        hour: parseInt(hour),
        minute: parseInt(minute),
        second: 0,
        millisecond: 0,
      });

    if (targetTime.isAfter(now) && targetTime.isBefore(endOfDay)) {
      const delay = targetTime.diff(now);
      const drug = await getDrugProductById(regimen.drug_product_id);
      await medicationQueue.add(
        {
          userId: reminderUserId,
          profileId: regimen.profile_id,
          regimenId: regimen.id,
          title: `⏰ Nhắc nhở uống thuốc`,
          body: `Đã đến giờ uống thuốc: ${drug.drug_product.brand_name}. Số lượng: ${doseInfo}`,
          dataPayload: {
            screen: "RegimenDetail",
            regimenId: regimen.id,
            id: regimen.id, // backward
          },
        },
        {
          delay,
          jobId: `remind-${regimen.id}-${targetTime.unix()}`,
          removeOnComplete: true,
        },
      );

      console.log(
        `[Scheduler] queued reminder regimen=${regimen.id} user=${reminderUserId} at=${targetTime.format("YYYY-MM-DD HH:mm:ss")} ${tz}`,
      );
    }
  }
};

module.exports = {
  scheduleRemindersForRegimen,
  cancelRemindersForRegimenTimes,
};
