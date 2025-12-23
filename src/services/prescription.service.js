const { Prescription, PatientProfile, PrescriptionItem } = require("../models");

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

module.exports = {
  createPrescription,
  addPrescriptionItem,
};
