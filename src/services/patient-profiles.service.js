const { User, PatientProfile } = require("../models/index");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
const createPatientProfile = async (
  owner_user_id,
  { full_name, date_of_birth, sex, relationship_to_owner, notes }
) => {
  if (!full_name || full_name.trim().length === 0) {
    throw httpError("Tên hồ sơ tạo mới không được để trống", 400);
  }
  const profileExist = await PatientProfile.findAll({
    where: {
      owner_user_id: owner_user_id,
      full_name: full_name,
      relationship_to_owner: relationship_to_owner,
    },
  });
  console.log("profileExist", profileExist);

  if (profileExist.length > 0) {
    throw httpError("Bạn đã có hồ sơ của người thân này rồi", 400);
  }
  const newProfile = await PatientProfile.create({
    owner_user_id: owner_user_id,
    full_name: full_name,
    date_of_birth: date_of_birth || null,
    sex: sex || null,
    relationship_to_owner: relationship_to_owner || null,
    notes: notes || null,
  });
  return newProfile;
};

module.exports = {
  createPatientProfile,
};
