const { MedicationRegimen } = require("../models/index");
const { Op } = require("sequelize");
const schedulerService = require("../services/scheduler.service");
const moment = require("moment-timezone");

const runDailyJob = async () => {
  console.log("⏰ [Cron] Bắt đầu quét đơn thuốc cho ngày mới...");

  try {
    // IMPORTANT:
    // start_date/end_date là DATEONLY trong DB. Nếu so với `new Date()` (timestamp)
    // sẽ dễ bị lệch logic trong ngày hiện tại (đặc biệt end_date = hôm nay).
    // => dùng chuỗi YYYY-MM-DD theo timezone chuẩn để so sánh DATEONLY.
    const tz = "Asia/Ho_Chi_Minh";
    const todayYmd = moment().tz(tz).format("YYYY-MM-DD");

    const activeRegimens = await MedicationRegimen.findAll({
      where: {
        is_active: true,
        [Op.or]: [{ end_date: { [Op.gte]: todayYmd } }, { end_date: null }],
        start_date: { [Op.lte]: todayYmd },
      },
    });

    console.log(
      `   -> Tìm thấy ${activeRegimens.length} đơn thuốc cần xử lý cho ${todayYmd} (${tz}).`,
    );

    for (const regimen of activeRegimens) {
      try {
        await schedulerService.scheduleRemindersForRegimen(regimen);
      } catch (e) {
        console.error(
          `[Cron] ❌ Lỗi khi schedule regimen ${regimen?.id}:`,
          e?.message || e,
        );
      }
    }

    console.log("✅ [Cron] Hoàn tất lên lịch cho ngày hôm nay.");
  } catch (error) {
    console.error("❌ [Cron] Lỗi khi chạy daily job:", error);
  }
};

module.exports = runDailyJob;