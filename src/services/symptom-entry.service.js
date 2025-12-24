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

  const t = await sequelize.transaction();

  try {
    const newEntry = await SymptomEntry.create(
      {
        profile_id: profileId,
        symptom_name,
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

const getSymptomsByProfile = async (
  userId,
  profileId,
  { from, to, limit = 20, offset = 0 }
) => {
  await checkAccess(userId, profileId);

  const where = {
    profile_id: profileId,
  };

  if (from || to) {
    where.recorded_at = {};
    if (from) {
      where.recorded_at[Op.gte] = new Date(from);
    }
    if (to) {
      where.recorded_at[Op.lte] = new Date(to);
    }
  }

  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const parsedOffset = parseInt(offset) || 0;

  const { count, rows } = await SymptomEntry.findAndCountAll({
    where,
    limit: parsedLimit,
    offset: parsedOffset,
    order: [["recorded_at", "DESC"]],
    distinct: true,

    include: [
      {
        model: MedicationRegimen,
        as: "regimens",
        attributes: ["id", "display_name", "drug_product_id"],

        through: {
          attributes: ["note"],
        },
      },
    ],
  });
  const formattedData = rows.map((entry) => {
    const plain = entry.get({ plain: true });

    return {
      id: plain.id,
      profile_id: plain.profile_id,
      symptom_name: plain.symptom_name,
      recorded_at: plain.recorded_at,
      severity_score: plain.severity_score,
      relation_to_med: plain.relation_to_med,
      description: plain.description,
      notes: plain.notes,
      linked_regimens: (plain.regimens || []).map((link) => ({
        regimen_id: link.id,
        display_name: link.regimen?.display_name || "Thuốc không xác định",
        drug_product_id: link.drug_product_id,
        note: link.SymptomMedicationLink.note,
      })),
    };
  });

  return formattedData;
};
const getSymptomDetail = async (userId, symptomId) => {
  const symptom = await SymptomEntry.findByPk(symptomId, {
    include: [
      {
        model: MedicationRegimen,
        as: "regimens",
        attributes: [
          "id",
          "display_name",
          "drug_product_id",
          "dose_unit",
          "total_daily_dose",
        ],
        through: {
          attributes: ["note"],
        },
      },
    ],
  });

  if (!symptom) {
    throw httpError("Triệu chứng không tồn tại", 404);
  }

  await checkAccess(userId, symptom.profile_id);

  const plain = symptom.get({ plain: true });

  return {
    id: plain.id,
    profile_id: plain.profile_id,
    symptom_name: plain.symptom_name,
    recorded_at: plain.recorded_at,
    severity_score: plain.severity_score,
    relation_to_med: plain.relation_to_med,
    description: plain.description,
    notes: plain.notes,
    created_at: plain.created_at,
    linked_regimens: (plain.regimens || []).map((r) => ({
      regimen_id: r.id,
      display_name: r.display_name,
      drug_product_id: r.drug_product_id,
      total_daily_dose: r.total_daily_dose,
      dose_unit: r.dose_unit,
      link_note: r.SymptomMedicationLink ? r.SymptomMedicationLink.note : null,
    })),
  };
};
module.exports = {
  createSymptomEntry,
  getSymptomsByProfile,
  getSymptomDetail,
};
