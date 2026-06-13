const { Op } = require("sequelize");
const { PatientProfile, ProfileShare } = require("../models");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Resolve profile access role for a user.
 * Returns role in lower-case: owner | caregiver | viewer
 */
const getProfileAccess = async (userId, profileId) => {
  if (!profileId) throw httpError("profileId is required", 400);

  const profile = await PatientProfile.findByPk(profileId, {
    attributes: ["id", "owner_user_id"],
  });

  if (!profile) throw httpError("Không tìm thấy hồ sơ bệnh nhân", 404);

  if (String(profile.owner_user_id) === String(userId)) {
    return { profile, role: "owner" };
  }

  const share = await ProfileShare.findOne({
    where: { profile_id: profileId, user_id: userId },
    attributes: ["role"],
  });

  if (!share) throw httpError("Bạn không có quyền truy cập hồ sơ này", 403);

  const role = String(share.role || "").toLowerCase();
  // normalize possible values
  if (["caregiver", "viewer"].includes(role)) {
    return { profile, role };
  }
  // fallback: treat unknown as viewer
  return { profile, role: "viewer" };
};

const assertProfileRole = async (userId, profileId, allowedRoles) => {
  const { profile, role } = await getProfileAccess(userId, profileId);
  const ok = (allowedRoles || []).map((r) => String(r).toLowerCase());
  if (!ok.includes(role)) {
    throw httpError("Bạn không có quyền", 403);
  }
  return { profile, role };
};

module.exports = {
  getProfileAccess,
  assertProfileRole,
};
