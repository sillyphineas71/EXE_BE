const { Op } = require("sequelize");
const { User, PatientProfile, ProfileShare } = require("../models/index");

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

const getAccessibleProfiles = async (currentUserId) => {
  const profiles = await PatientProfile.findAll({
    include: [
      {
        model: ProfileShare,
        as: "shares",
        required: false,
        where: {
          user_id: currentUserId,
        },
      },
    ],
    where: {
      [Op.or]: [
        { owner_user_id: currentUserId },
        { "$shares.user_id$": currentUserId },
      ],
    },
  });

  const result = profiles.map((profile) => {
    const p = profile.get({ plain: true });

    let myRole = "";
    if (p.owner_user_id === currentUserId) {
      myRole = "OWNER";
    } else if (p.shares && p.shares.length > 0) {
      myRole = p.shares[0].role;
    }
    delete p.shares;
    return {
      ...p,
      role: myRole.toUpperCase(),
    };
  });

  return result;
};
const getProfileDetail = async (profileId, userId) => {
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
        where: {
          user_id: userId,
        },
      },
    ],
  });

  if (!profile) {
    throw httpError(
      "Hồ sơ không tồn tại hoặc bạn không có quyền truy cập",
      404
    );
  }

  const p = profile.get({ plain: true });
  let currentRole = "";

  if (p.owner_user_id === userId) {
    currentRole = "OWNER";
  } else if (p.shares && p.shares.length > 0) {
    currentRole = p.shares[0].role;
  }
  delete p.shares;

  return {
    ...p,
    role: currentRole.toUpperCase(),
  };
};
module.exports = {
  createPatientProfile,
  getAccessibleProfiles,
  getProfileDetail,
};
