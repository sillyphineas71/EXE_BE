const { Op } = require("sequelize");
const {
  sequelize,
  User,
  PatientProfile,
  ProfileShare,
  MedicationRegimen,
  PrescriptionItem,
  DrugProduct,
} = require("../models/index");
const { DateTime } = require("luxon");
const { generateIntakeEventsForRegimen } = require("./intake.service");


const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
const checkAccess = async (userId, profileId) => {
  const profile = await PatientProfile.findOne({
    where: {
      id: profileId,
      [Op.or]: [{ owner_user_id: userId }, { "$shares.user_id$": userId }],
    },
    include: [
      {
        model: ProfileShare,
        as: "shares",
        required: false,
        where: { user_id: userId },
      },
    ],
  });

  if (!profile) {
    throw httpError(
      "Hồ sơ không tồn tại hoặc bạn không có quyền truy cập",
      403
    );
  }
  return profile;
};


const createRegimes = async (userId, profileId, data) => {
  const {
    prescription_item_id,
    drug_product_id,
    display_name,
    total_daily_dose,
    dose_unit,
    start_date,
    duration_days,
    schedule_type,
    schedule_payload,
    timezone,
  } = data;

  await checkAccess(userId, profileId);

  if (!["fixed_times", "interval_hours", "custom"].includes(schedule_type)) {
    throw httpError("Loại lịch (schedule_type) không hợp lệ", 400);
  }

  if (prescription_item_id) {
    const itemExist = await PrescriptionItem.findByPk(prescription_item_id);
    if (!itemExist) {
      throw httpError("Dòng thuốc trong đơn không tồn tại", 400);
    }
  }

  // ✅ Validate duration_days
  if (duration_days == null) {
    throw httpError("Thiếu duration_days (số ngày dùng thuốc)", 400);
  }
  const days = Number(duration_days);
  if (!Number.isInteger(days) || days <= 0) {
    throw httpError("duration_days phải là số nguyên dương", 400);
  }
  // (tuỳ bạn) giới hạn để tránh nhập bậy
  if (days > 3650) {
    throw httpError("duration_days quá lớn", 400);
  }

  const tz = timezone || "Asia/Ho_Chi_Minh";

  // ✅ Parse + normalize start_date theo timezone
  // Nếu không nhập start_date thì lấy "hôm nay" theo timezone, startOf('day')
  const startDT = start_date
    ? DateTime.fromISO(start_date, { zone: tz })
    : DateTime.now().setZone(tz);

  if (!startDT.isValid) {
    throw httpError("start_date không hợp lệ (ISO string)", 400);
  }

  // Nếu start_date là ngày bắt đầu uống -> chuẩn hoá về đầu ngày
  const start = startDT.startOf("day");

  // ✅ end_date inclusive: ngày cuối uống = start + (days - 1) và set cuối ngày
  const end = start.plus({ days: days - 1 }).endOf("day");

  // Sử dụng transaction để đảm bảo data consistency
  const transaction = await sequelize.transaction();

  try {
    const newRegimen = await MedicationRegimen.create(
      {
        profile_id: profileId,
        prescription_item_id: prescription_item_id || null,
        drug_product_id,
        display_name,
        total_daily_dose,
        dose_unit,
        start_date: start.toJSDate(),
        end_date: end.toJSDate(),
        is_active: true,
        schedule_type,
        schedule_payload,
        timezone: tz,
        created_by_user_id: userId,
      },
      { transaction }
    );

    // ✅ Tự động tạo MedicationIntakeEvent
    await generateIntakeEventsForRegimen(newRegimen, transaction);

    // Commit transaction
    await transaction.commit();

    return newRegimen;
  } catch (error) {
    // Rollback nếu có lỗi
    await transaction.rollback();
    console.error("[createRegimes] Error:", error);
    throw error;
  }
};

const getRegimensByProfile = async (userId, profileId, is_active) => {
  await checkAccess(userId, profileId);

  let whereClause = { profile_id: profileId };

  if (is_active === "false") {
    whereClause.is_active = false;
  } else if (is_active === "all") {
  } else {
    whereClause.is_active = true;
  }

  const regimens = await MedicationRegimen.findAll({
    where: whereClause,
    attributes: [
      "id",
      "display_name",
      "total_daily_dose",
      "dose_unit",
      "start_date",
      "end_date",
      "schedule_type",
      "is_active",
      "schedule_payload",
    ],
    order: [
      ["is_active", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return regimens;
};
const getRegimenDetail = async (userId, regimenId) => {
  const regimen = await MedicationRegimen.findByPk(regimenId, {
    include: [
      {
        model: DrugProduct,
        as: "drugProduct",
        attributes: ["id", "brand_name"],
      },
    ],
  });
  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }

  await checkAccess(userId, regimen.profile_id);

  return regimen;
};
const updateRegimen = async (userId, regimenId, data) => {
  const regimen = await MedicationRegimen.findByPk(regimenId);
  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }
  await checkAccess(userId, regimen.profile_id);

  const {
    display_name,
    total_daily_dose,
    dose_unit,
    start_date,
    end_date,
    schedule_type,
    schedule_payload,
    timezone,
  } = data;

  if (
    schedule_type &&
    !["fixed_times", "interval_hours", "custom"].includes(schedule_type)
  ) {
    throw httpError("Loại lịch (schedule_type) không hợp lệ", 400);
  }

  if (display_name !== undefined) regimen.display_name = display_name;
  if (total_daily_dose !== undefined)
    regimen.total_daily_dose = total_daily_dose;
  if (dose_unit !== undefined) regimen.dose_unit = dose_unit;
  if (start_date !== undefined) regimen.start_date = start_date;
  if (end_date !== undefined) regimen.end_date = end_date;
  if (schedule_type !== undefined) regimen.schedule_type = schedule_type;
  if (schedule_payload !== undefined)
    regimen.schedule_payload = schedule_payload;
  if (timezone !== undefined) regimen.timezone = timezone;

  await regimen.save();
  return regimen;
};
const stopRegimen = async (userId, regimenId) => {
  const regimen = await MedicationRegimen.findByPk(regimenId);

  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }
  await checkAccess(userId, regimen.profile_id);

  if (regimen.is_active === false) {
    throw httpError("Thuốc này đã được ngừng trước đó rồi", 400);
  }

  regimen.is_active = false;

  regimen.end_date = new Date();

  await regimen.save();

  return true;
};
module.exports = {
  createRegimes,
  getRegimensByProfile,
  getRegimenDetail,
  updateRegimen,
  stopRegimen,
};
