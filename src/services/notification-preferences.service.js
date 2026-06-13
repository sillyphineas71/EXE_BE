const { NotificationPreference } = require("../models");
const { assertProfileRole } = require("./profile-access.service");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidTimeHHmm = (s) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(s).trim());
const isValidTimeHHmmss = (s) =>
  /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(String(s).trim());

// Store in DB as HH:mm:ss (TIME)
const normalizeTimeToHHmmss = (value) => {
  if (value === undefined) return undefined; // not provided
  if (value === null) return null;

  const v = String(value).trim();
  if (!v) return null;

  if (isValidTimeHHmmss(v)) return v;
  if (isValidTimeHHmm(v)) return `${v}:00`;

  throw httpError("Giờ phải theo định dạng HH:mm (vd 22:30)", 400);
};

// Return to FE as HH:mm
const formatTimeToHHmm = (value) => {
  if (!value) return "";
  const v = String(value);
  // postgres time often returns HH:mm:ss
  if (isValidTimeHHmmss(v)) return v.slice(0, 5);
  if (isValidTimeHHmm(v)) return v;
  return "";
};

const toPublic = (prefInstance) => {
  if (!prefInstance) return null;
  const p = prefInstance.get ? prefInstance.get({ plain: true }) : prefInstance;
  return {
    id: p.id,
    user_id: p.user_id,
    profile_id: p.profile_id,
    allow_push: p.allow_push,
    allow_email: p.allow_email,
    quiet_hours_start: formatTimeToHHmm(p.quiet_hours_start),
    quiet_hours_end: formatTimeToHHmm(p.quiet_hours_end),
    timezone: p.timezone,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
};

/**
 * GET /notification-preferences?profile_id=
 * - If profile_id provided: return [] or [pref]
 * - Else: return list for user
 */
const listPreferences = async (userId, profileId) => {
  const pid = profileId === "" ? undefined : profileId;

  if (pid) {
    // any access role can read preferences for a profile
    await assertProfileRole(userId, pid, ["owner", "caregiver", "viewer"]);

    const pref = await NotificationPreference.findOne({
      where: { user_id: userId, profile_id: pid },
      order: [["updated_at", "DESC"]],
    });

    return pref ? [toPublic(pref)] : [];
  }

  const rows = await NotificationPreference.findAll({
    where: { user_id: userId },
    order: [["updated_at", "DESC"]],
  });

  return rows.map(toPublic);
};

/**
 * PUT /notification-preferences
 * Upsert by unique(user_id, profile_id)
 */
const upsertPreference = async (userId, data) => {
  const profileId = data.profile_id ?? null;

  if (profileId) {
    // any access role can set their own preferences for this profile
    await assertProfileRole(userId, profileId, [
      "owner",
      "caregiver",
      "viewer",
    ]);
  }

  const updates = {};

  if (data.allow_push !== undefined) updates.allow_push = !!data.allow_push;
  if (data.allow_email !== undefined) updates.allow_email = !!data.allow_email;

  if (data.quiet_hours_start !== undefined) {
    updates.quiet_hours_start = normalizeTimeToHHmmss(data.quiet_hours_start);
  }
  if (data.quiet_hours_end !== undefined) {
    updates.quiet_hours_end = normalizeTimeToHHmmss(data.quiet_hours_end);
  }

  if (data.timezone !== undefined) {
    const tz = String(data.timezone || "").trim();
    if (!tz) throw httpError("timezone không hợp lệ", 400);
    updates.timezone = tz;
  }

  if (Object.keys(updates).length === 0) {
    throw httpError("Không có dữ liệu để cập nhật", 400);
  }

  const where = {
    user_id: userId,
    profile_id: profileId || null,
  };

  let pref = await NotificationPreference.findOne({ where });

  if (!pref) {
    pref = await NotificationPreference.create({
      ...where,
      ...updates,
      created_at: new Date(),
      updated_at: new Date(),
    });
  } else {
    await pref.update({
      ...updates,
      updated_at: new Date(),
    });
    await pref.reload();
  }

  return toPublic(pref);
};

module.exports = {
  listPreferences,
  upsertPreference,
};
