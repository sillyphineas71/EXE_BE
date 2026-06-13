const { Op } = require("sequelize");
const { User, PatientProfile, ProfileShare } = require("../models/index");
const { buildSubscriptionInfo } = require("./subscription.service");

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
  const owner = await User.findByPk(owner_user_id, {
    attributes: ["id", "account_tier", "premium_plan_code", "premium_expires_at"],
  });

  if (!owner) {
    throw httpError("Không tìm thấy người dùng", 404);
  }

  const subscription = buildSubscriptionInfo(owner.get({ plain: true }));

  const ownedProfilesCount = await PatientProfile.count({
    where: { owner_user_id },
  });

  const relationshipCheck = String(relationship_to_owner || "self").toLowerCase();

  // FREE: chỉ được tạo 1 hồ sơ (bản thân)
  if (!subscription.can_create_multiple_profiles) {
    // Nếu đã có >=1 hồ sơ owned thì chặn tạo thêm
    if (ownedProfilesCount >= 1) {
      throw httpError(
        "Tài khoản thường chỉ được tạo 1 hồ sơ. Vui lòng nâng cấp Premium để tạo nhiều hồ sơ.",
        403
      );
    }

    // Nếu là hồ sơ đầu tiên nhưng không phải 'self' thì cũng chặn
    if (relationshipCheck !== "self") {
      throw httpError(
        "Tài khoản thường chỉ được tạo hồ sơ bản thân (relationship_to_owner = self).",
        403
      );
    }
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
    relationship_to_owner: relationship_to_owner || self,
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
const updateProfile = async (
  userId,
  profileId,
  { full_name, date_of_birth, sex, relationship_to_owner, notes }
) => {
  const profile = await PatientProfile.findByPk(profileId);

  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }
  console.log(profile);
  console.log("profileId", userId);

  if (String(profile.owner_user_id) !== String(userId)) {
    throw httpError("Bạn không có quyền chỉnh sửa hồ sơ này", 403);
  }

  profile.full_name = full_name || profile.full_name;
  profile.date_of_birth = date_of_birth || profile.date_of_birth;
  profile.sex = sex || profile.sex;
  profile.relationship_to_owner =
    relationship_to_owner || profile.relationship_to_owner;
  profile.notes = notes !== undefined ? notes : profile.notes;

  const result = await profile.save();

  return result;
};
const deleteProfile = async (userId, profileId) => {
  const profile = await PatientProfile.findByPk(profileId);

  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }

  if (String(profile.owner_user_id) !== String(userId)) {
    throw httpError("Bạn không có quyền xóa hồ sơ này", 403);
  }

  await profile.destroy();

  return true;
};
module.exports = {
  createPatientProfile,
  getAccessibleProfiles,
  getProfileDetail,
  updateProfile,
  deleteProfile,
};
