const { MedicationRegimen } = require("../models/index");
const { Op } = require("sequelize");
const schedulerService = require("../services/scheduler.service");

const runDailyJob = async () => {
  console.log("⏰ [Cron] Bắt đầu quét đơn thuốc cho ngày mới...");

  try {
    const today = new Date();
    const activeRegimens = await MedicationRegimen.findAll({
      where: {
        is_active: true,
        [Op.or]: [{ end_date: { [Op.gte]: today } }, { end_date: null }],
        start_date: { [Op.lte]: today },
      },
    });

    console.log(`   -> Tìm thấy ${activeRegimens.length} đơn thuốc cần xử lý.`);
    for (const regimen of activeRegimens) {
      await schedulerService.scheduleRemindersForRegimen(regimen);
    }

    console.log("✅ [Cron] Hoàn tất lên lịch cho ngày hôm nay.");
  } catch (error) {
    console.error("❌ [Cron] Lỗi khi chạy daily job:", error);
  }
};

module.exports = runDailyJob;
