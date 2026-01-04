const moment = require("moment-timezone");
const medicationQueue = require("../queues/medication.queue");

/**
 * CORE LOGIC: Lên lịch nhắc nhở cho 1 đơn thuốc (Regimen)
 * Hàm này sẽ được gọi bởi:
 * 1. Cron Job (chạy đầu ngày)
 * 2. API (khi user vừa tạo/sửa đơn thuốc)
 * * @param {Object} regimen - Object chứa thông tin từ bảng medication_regimens
 */
const scheduleRemindersForRegimen = async (regimen) => {
  try {
    // 1. VALIDATE CƠ BẢN
    if (!regimen) return;

    // Kiểm tra hiệu lực (is_active)
    if (regimen.is_active === false) {
      console.log(`[Scheduler] Regimen ${regimen.id} đã bị vô hiệu hóa.`);
      return;
    }

    const tz = regimen.timezone || "Asia/Ho_Chi_Minh";

    // Lấy thời điểm hiện tại theo múi giờ đó
    const now = moment().tz(tz);
    const endOfDay = moment().tz(tz).endOf("day");

    // Kiểm tra ngày bắt đầu/kết thúc
    if (
      regimen.start_date &&
      moment(regimen.start_date).tz(tz).startOf("day").isAfter(now)
    ) {
      console.log(`[Scheduler] Regimen ${regimen.id} chưa đến ngày bắt đầu.`);
      return;
    }

    if (
      regimen.end_date &&
      moment(regimen.end_date).tz(tz).endOf("day").isBefore(now)
    ) {
      console.log(`[Scheduler] Regimen ${regimen.id} đã hết hạn.`);
      return;
    }
    // 2. XỬ LÝ THEO LOẠI LỊCH (SCHEDULE TYPE)
    if (regimen.schedule_type === "fixed_times") {
      await handleFixedTimes(regimen, now, endOfDay, tz);
    } else if (regimen.schedule_type === "interval_hours") {
      // TODO: Xử lý logic uống cách nhau X giờ (sẽ làm ở Phase nâng cao)
      console.log(
        `[Scheduler] Loại lịch 'interval_hours' chưa hỗ trợ lúc này.`
      );
    } else {
      console.log(
        `[Scheduler] Loại lịch ${regimen.schedule_type} không xác định.`
      );
    }
  } catch (error) {
    console.error(
      `[Scheduler] ❌ Lỗi khi lên lịch cho Regimen ${regimen.id}:`,
      error
    );
  }
};

/**
 * Logic xử lý cho kiểu lịch 'fixed_times'
 * Ví dụ payload: { "times": ["08:00", "20:00"] }
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

  for (const timeStr of times) {
    const [hour, minute] = timeStr.split(":");
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

      // --- CẬP NHẬT NỘI DUNG TẠI ĐÂY ---
      await medicationQueue.add(
        {
          userId: regimen.created_by_user_id,
          profileId: regimen.profile_id,
          regimenId: regimen.id,
          title: `⏰ Nhắc nhở uống thuốc`,
          body: `Đã đến giờ uống thuốc: ${regimen.display_name}. Số lượng: ${doseInfo}`,

          dataPayload: {
            screen: "RegimenDetail",
            id: regimen.id,
          },
        },
        {
          delay: delay,
          jobId: `remind-${regimen.id}-${targetTime.unix()}`,
          removeOnComplete: true,
        }
      );
    }
  }
};

module.exports = {
  scheduleRemindersForRegimen,
};
