const { Op } = require("sequelize");
const {
  User,
  PatientProfile,
  ProfileShare,
  MedicationRegimen,
  PrescriptionItem,
  DrugProduct,
} = require("../models/index");

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
    end_date,
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
  const newRegimen = await MedicationRegimen.create({
    profile_id: profileId,
    prescription_item_id: prescription_item_id || null,
    drug_product_id,
    display_name,
    total_daily_dose,
    dose_unit,
    start_date: start_date || new Date(),
    end_date,
    is_active: true,
    schedule_type,
    schedule_payload,
    timezone: timezone || "Asia/Ho_Chi_Minh",

    created_by_user_id: userId,
  });

  return newRegimen;
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

  console.log("whereClause:", whereClause);

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
module.exports = { createRegimes, getRegimensByProfile, getRegimenDetail };
