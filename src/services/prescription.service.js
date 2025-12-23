const {
  Prescription,
  PatientProfile,
  PrescriptionItem,
  PrescriptionFile,
} = require("../models");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createPrescription = async (userId, profileId, data) => {
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) {
    throw httpError("Không tìm thấy hồ sơ bệnh nhân", 404);
  }

  if (profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền truy cập hồ sơ này", 403);
  }

  const {
    prescriber_name,
    prescriber_specialty,
    facility_name,
    issued_date,
    note,
    source_type = "manual",
  } = data;

  const prescription = await Prescription.create({
    profile_id: profileId,
    prescriber_name: prescriber_name || null,
    prescriber_specialty: prescriber_specialty || null,
    facility_name: facility_name || null,
    issued_date: issued_date || null,
    note: note || null,
    source_type,
    created_by_user_id: userId,
  });

  const result = prescription.get({ plain: true });
  return {
    id: result.id,
    profile_id: result.profile_id,
    prescriber_name: result.prescriber_name,
    prescriber_specialty: result.prescriber_specialty,
    facility_name: result.facility_name,
    issued_date: result.issued_date,
    note: result.note,
    source_type: result.source_type,
    status: result.status,
    created_by_user_id: result.created_by_user_id,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
};

const addPrescriptionItem = async (userId, prescriptionId, data) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "owner_user_id"],
      },
    ],
  });

  if (!prescription) {
    throw httpError("Không tìm thấy đơn thuốc", 404);
  }

  if (prescription.profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền truy cập đơn thuốc này", 403);
  }

  const {
    original_name_text,
    original_instructions,
    drug_product_id,
    substance_id,
    dose_amount,
    dose_unit,
    frequency_text,
    route,
    duration_days,
    start_date,
    end_date,
    is_prn = false,
    notes,
  } = data;

  if (!original_name_text || !original_name_text.trim()) {
    throw httpError("Tên thuốc là bắt buộc", 400);
  }

  const item = await PrescriptionItem.create({
    prescription_id: prescriptionId,
    original_name_text: original_name_text.trim(),
    original_instructions: original_instructions || null,
    drug_product_id: drug_product_id || null,
    substance_id: substance_id || null,
    dose_amount: dose_amount || null,
    dose_unit: dose_unit || null,
    frequency_text: frequency_text || null,
    route: route || null,
    duration_days: duration_days || null,
    start_date: start_date || null,
    end_date: end_date || null,
    is_prn,
    notes: notes || null,
  });

  const result = item.get({ plain: true });
  return {
    id: result.id,
    prescription_id: result.prescription_id,
    original_name_text: result.original_name_text,
    original_instructions: result.original_instructions,
    drug_product_id: result.drug_product_id,
    substance_id: result.substance_id,
    dose_amount: result.dose_amount,
    dose_unit: result.dose_unit,
    frequency_text: result.frequency_text,
    route: result.route,
    duration_days: result.duration_days,
    start_date: result.start_date,
    end_date: result.end_date,
    is_prn: result.is_prn,
    notes: result.notes,
  };
};

const getPrescriptionById = async (userId, prescriptionId) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "owner_user_id", "full_name"],
      },
      {
        model: PrescriptionItem,
        as: "items",
        attributes: [
          "id",
          "original_name_text",
          "original_instructions",
          "drug_product_id",
          "substance_id",
          "dose_amount",
          "dose_unit",
          "frequency_text",
          "route",
          "duration_days",
          "start_date",
          "end_date",
          "is_prn",
          "notes",
        ],
      },
      {
        model: PrescriptionFile,
        as: "files",
        attributes: ["id", "file_url", "file_type", "created_at"],
      },
    ],
  });

  if (!prescription) {
    throw httpError("Không tìm thấy đơn thuốc", 404);
  }

  if (prescription.profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền truy cập đơn thuốc này", 403);
  }

  const plain = prescription.get({ plain: true });
  return {
    prescription: {
      id: plain.id,
      profile_id: plain.profile_id,
      prescriber_name: plain.prescriber_name,
      prescriber_specialty: plain.prescriber_specialty,
      facility_name: plain.facility_name,
      issued_date: plain.issued_date,
      note: plain.note,
      source_type: plain.source_type,
      status: plain.status,
      created_by_user_id: plain.created_by_user_id,
      created_at: plain.created_at,
      updated_at: plain.updated_at,
    },
    items: plain.items || [],
    files: plain.files || [],
  };
};

const updatePrescriptionItem = async (userId, prescriptionId, itemId, data) => {
  const item = await PrescriptionItem.findOne({
    where: { id: itemId, prescription_id: prescriptionId },
  });

  if (!item) {
    throw httpError("Không tìm thấy thuốc trong đơn", 404);
  }

  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "owner_user_id"],
      },
    ],
  });

  if (!prescription || prescription.profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền chỉnh sửa đơn thuốc này", 403);
  }

  const updates = {};
  const allowedFields = [
    "original_name_text",
    "original_instructions",
    "drug_product_id",
    "substance_id",
    "dose_amount",
    "dose_unit",
    "frequency_text",
    "route",
    "duration_days",
    "start_date",
    "end_date",
    "is_prn",
    "notes",
  ];

  allowedFields.forEach((field) => {
    if (data.hasOwnProperty(field)) {
      if (field === "original_name_text" && data[field]) {
        updates[field] = data[field].trim();
      } else {
        updates[field] = data[field] || null;
      }
    }
  });

  if (updates.original_name_text && !updates.original_name_text.trim()) {
    throw httpError("Tên thuốc không được để trống", 400);
  }

  if (Object.keys(updates).length === 0) {
    throw httpError("Không có dữ liệu để cập nhật", 400);
  }

  await item.update(updates);
  await item.reload();

  const result = item.get({ plain: true });
  return {
    id: result.id,
    prescription_id: result.prescription_id,
    original_name_text: result.original_name_text,
    original_instructions: result.original_instructions,
    drug_product_id: result.drug_product_id,
    substance_id: result.substance_id,
    dose_amount: result.dose_amount,
    dose_unit: result.dose_unit,
    frequency_text: result.frequency_text,
    route: result.route,
    duration_days: result.duration_days,
    start_date: result.start_date,
    end_date: result.end_date,
    is_prn: result.is_prn,
    notes: result.notes,
  };
};

const deletePrescriptionItem = async (userId, prescriptionId, itemId) => {
  const item = await PrescriptionItem.findOne({
    where: { id: itemId, prescription_id: prescriptionId },
  });

  if (!item) {
    throw httpError("Không tìm thấy thuốc trong đơn", 404);
  }

  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "owner_user_id"],
      },
    ],
  });

  if (!prescription || prescription.profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền xoá thuốc trong đơn này", 403);
  }

  await item.destroy();
};

const updatePrescription = async (userId, prescriptionId, data) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PatientProfile,
        as: "profile",
        attributes: ["id", "owner_user_id"],
      },
    ],
  });

  if (!prescription) {
    throw httpError("Không tìm thấy đơn thuốc", 404);
  }

  if (prescription.profile.owner_user_id !== userId) {
    throw httpError("Bạn không có quyền chỉnh sửa đơn thuốc này", 403);
  }

  const updates = {};
  const allowedFields = [
    "prescriber_name",
    "prescriber_specialty",
    "facility_name",
    "issued_date",
    "note",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data.hasOwnProperty(field)) {
      updates[field] = data[field] || null;
    }
  });

  if (
    data.status &&
    !["active", "completed", "cancelled"].includes(data.status)
  ) {
    throw httpError(
      "Trạng thái không hợp lệ. Chỉ chấp nhận: active, completed, cancelled",
      400
    );
  }

  if (Object.keys(updates).length === 0) {
    throw httpError("Không có dữ liệu để cập nhật", 400);
  }

  updates.updated_at = new Date();
  await prescription.update(updates);
  await prescription.reload();

  const result = prescription.get({ plain: true });
  return {
    id: result.id,
    profile_id: result.profile_id,
    prescriber_name: result.prescriber_name,
    prescriber_specialty: result.prescriber_specialty,
    facility_name: result.facility_name,
    issued_date: result.issued_date,
    note: result.note,
    source_type: result.source_type,
    status: result.status,
    created_by_user_id: result.created_by_user_id,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
};

module.exports = {
  createPrescription,
  addPrescriptionItem,
  getPrescriptionById,
  updatePrescriptionItem,
  deletePrescriptionItem,
  updatePrescription,
};
