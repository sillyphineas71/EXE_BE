const { Prescription, PatientProfile } = require("../models");

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

module.exports = {
  createPrescription,
};
