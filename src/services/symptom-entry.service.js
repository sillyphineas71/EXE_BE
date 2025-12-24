const { Op } = require("sequelize");
const {
  PatientProfile,
  ProfileShare,
  MedicationRegimen,
  PrescriptionItem,
  SymptomEntry,
  SymptomMedicationLink,
  sequelize,
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

const createSymptomEntry = async (userId, profileId, data) => {
  const {
    symptom_name,
    severity_score,
    relation_to_med,
    description,
    notes,
    related_regimen_ids,
    recorded_at,
  } = data;

  await checkAccess(userId, profileId);

  if (!symptom_name) throw httpError("Tên triệu chứng là bắt buộc", 400);

  if (
    severity_score !== undefined &&
    (severity_score < 0 || severity_score > 10)
  ) {
    throw httpError("Mức độ phải từ 0-10", 400);
  }
  if (
    related_regimen_ids &&
    Array.isArray(related_regimen_ids) &&
    related_regimen_ids.length > 0
  ) {
    const validCount = await MedicationRegimen.count({
      where: {
        id: related_regimen_ids,
        profile_id: profileId,
      },
    });
    const uniqueInputIds = new Set(related_regimen_ids);

    if (validCount !== uniqueInputIds.size) {
      throw httpError(
        "Danh sách thuốc nghi ngờ chứa thuốc không tồn tại hoặc không thuộc hồ sơ này",
        400
      );
    }
  }

  let finalRecordedAt = new Date();

  if (recorded_at) {
    const parsedDate = new Date(recorded_at);

    // Check 1: Ngày tháng có hợp lệ không (VD: gửi lên chuỗi "abc")
    if (isNaN(parsedDate.getTime())) {
      throw httpError("Thời gian ghi nhận (recorded_at) không hợp lệ", 400);
    }

    // Check 2: Không được nhập tương lai (Cho phép lệch 5 phút do đồng hồ máy lệch)
    if (parsedDate > new Date(Date.now() + 5 * 60000)) {
      throw httpError("Thời gian triệu chứng không thể ở tương lai", 400);
    }

    finalRecordedAt = parsedDate;
  }
  // ------------------------------------

  const t = await sequelize.transaction();

  try {
    const newEntry = await SymptomEntry.create(
      {
        profile_id: profileId,
        symptom_name,
        // 2. Sử dụng biến thời gian đã xử lý ở trên
        recorded_at: finalRecordedAt,
        severity_score,
        relation_to_med,
        description,
        notes,
        created_by_user_id: userId,
      },
      { transaction: t }
    );

    if (
      related_regimen_ids &&
      Array.isArray(related_regimen_ids) &&
      related_regimen_ids.length > 0
    ) {
      const linkData = related_regimen_ids.map((regimenId) => ({
        symptom_entry_id: newEntry.id,
        regimen_id: regimenId,
        note: null,
      }));
      await SymptomMedicationLink.bulkCreate(linkData, { transaction: t });
    }

    await t.commit();

    return newEntry;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
module.exports = {
  createSymptomEntry,
};
