const { Op } = require("sequelize");
const { User, PatientProfile, ProfileShare, Role } = require("../models/index");
const { sendProfileShareNotification } = require("./email.service");

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
const createProfileShare = async (userId, profileId, data) => {
  await checkAccess(userId, profileId);
  const { user_email, role } = data;
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }
  const user = await User.findOne({ where: { email: user_email } });
  if (!user) {
    throw httpError(
      "Người dùng không tồn tại. Không thể chia sẻ với người này",
      404
    );
  }
  const existingShare = await ProfileShare.findOne({
    where: {
      profile_id: profileId,
      user_id: user.id,
    },
  });
  if (existingShare) {
    throw httpError("Bạn đã chia sẻ hồ sơ với người dùng này", 400);
  }
  if (user.id === userId) {
    throw httpError("Bạn đã sở hữu hồ sơ này", 400);
  }
  const newProfileShare = await ProfileShare.create({
    profile_id: profileId,
    user_id: user.id,
    role: role,
  });

  // Send email notification (async, don't wait for result)
  // If email fails, log error but don't fail the share operation
  const sharerUser = await User.findByPk(userId);
  sendProfileShareNotification({
    recipientEmail: user.email,
    recipientName: user.full_name,
    sharerName: sharerUser ? sharerUser.full_name : "Người dùng",
    profileName: profile.full_name,
    role: role,
  }).catch((error) => {
    console.error(
      `⚠️  Failed to send email notification for profile share ${newProfileShare.id}:`,
      error.message
    );
  });

  return newProfileShare;
};
const getUserOfProfileShare = async (userId, profileId) => {
  await checkAccess(userId, profileId);
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }
  const profileShares = await ProfileShare.findAll({
    where: { profile_id: profileId },
    include: {
      model: User,
      as: "user",
      required: false,
      include: [
        {
          model: Role,
          as: "role",
        },
      ],
    },
  });
  const fomatchReturn = profileShares.map((s) => ({
    id: s.id,
    profile_id: s.profile_id,
    user_id: s.user_id,
    role: s.role,
    user: {
      full_name: s.user.full_name,
      email: s.user.email,
      role: s.user.role.code,
    },
  }));
  return fomatchReturn;
};
const updateProfileShare = async (userId, profileId, shareId, data) => {
  await checkAccess(userId, profileId);
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }
  if (profile.owner_user_id != userId) {
    throw httpError(
      "Bạn không phải là người sở hữu hồ sơ này không thể sửa",
      400
    );
  }
  const { role } = data;
  const profileShare = await ProfileShare.findByPk(shareId);
  if (!profileShare) {
    throw httpError("Chia sẻ hồ sơ không tồn tại", 404);
  }
  profileShare.role = role.toLowerCase();
  await profileShare.save();
  return profileShare;
};
const deleteProfileShare = async (userId, profileId, shareId) => {
  await checkAccess(userId, profileId);
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) {
    throw httpError("Hồ sơ bệnh nhân không tồn tại", 404);
  }
  if (profile.owner_user_id != userId) {
    throw httpError(
      "Bạn không phải là người sở hữu hồ sơ này không thể xoá",
      400
    );
  }
  const profileShare = await ProfileShare.findByPk(shareId);
  if (!profileShare) {
    throw httpError("Chia sẻ hồ sơ không tồn tại", 404);
  }
  await profileShare.destroy();
};
module.exports = {
  createProfileShare,
  getUserOfProfileShare,
  updateProfileShare,
  deleteProfileShare,
};
