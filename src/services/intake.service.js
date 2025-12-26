const { Op } = require("sequelize");
const {
  sequelize,
  MedicationIntakeEvent,
  PatientProfile,
  ProfileShare,
} = require("../models");

const httpError = (message, statusCode, details) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
};

const getProfileAccess = async (userId, profileId) => {
  const profile = await PatientProfile.findByPk(profileId, {
    attributes: ["id", "owner_user_id"],
  });

  if (!profile) throw httpError("Không tìm thấy hồ sơ bệnh nhân", 404);

  if (profile.owner_user_id === userId) return { profile, role: "owner" };

  const share = await ProfileShare.findOne({
    where: { profile_id: profileId, user_id: userId },
    attributes: ["role"],
  });

  if (!share) throw httpError("Bạn không có quyền truy cập hồ sơ này", 403);

  return { profile, role: share.role };
};

const parseDate = (value, fieldName) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime()))
    throw httpError(`${fieldName} không hợp lệ`, 400);
  return d;
};

const listIntakeEventsInRange = async (userId, profileId, query) => {
  const { role } = await getProfileAccess(userId, profileId);
  if (!["owner", "caregiver", "viewer"].includes(role))
    throw httpError("Không có quyền", 403);

  const from = parseDate(query.from || query.from_datetime, "from_datetime");
  const to = parseDate(query.to || query.to_datetime, "to_datetime");
  if (from.getTime() > to.getTime())
    throw httpError("from_datetime phải <= to_datetime", 400);

  const where = {
    profile_id: profileId,
    scheduled_time: { [Op.between]: [from, to] },
  };

  if (query.status) where.status = query.status;
  if (query.regimen_id) where.regimen_id = query.regimen_id;

  const events = await MedicationIntakeEvent.findAll({
    where,
    order: [
      ["scheduled_time", "ASC"],
      ["created_at", "ASC"],
    ],
  });

  return events.map((e) => e.get({ plain: true }));
};

const updateIntakeEventCheckin = async (userId, intakeEventId, data) => {
  const event = await MedicationIntakeEvent.findByPk(intakeEventId);
  if (!event) throw httpError("Không tìm thấy intake event", 404);

  const { role } = await getProfileAccess(userId, event.profile_id);
  if (!["owner", "caregiver"].includes(role))
    throw httpError("Bạn không có quyền check-in", 403);

  const updates = {};
  const allowedFields = ["status", "taken_time", "dose_amount_taken", "notes"];
  for (const f of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, f)) updates[f] = data[f];
  }
  if (Object.keys(updates).length === 0)
    throw httpError("Không có dữ liệu để cập nhật", 400);

  if (updates.status) {
    const ok = ["taken", "skipped", "delayed"];
    if (!ok.includes(updates.status)) {
      throw httpError("status không hợp lệ (taken|skipped|delayed)", 400);
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, "taken_time")) {
    if (updates.taken_time === null || updates.taken_time === "") {
      updates.taken_time = new Date();
    } else {
      const t = new Date(updates.taken_time);
      if (Number.isNaN(t.getTime()))
        throw httpError("taken_time không hợp lệ", 400);
      updates.taken_time = t;
    }
  } else {
    updates.taken_time = new Date();
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "notes") &&
    updates.notes === ""
  )
    updates.notes = null;
  if (Object.prototype.hasOwnProperty.call(updates, "dose_amount_taken")) {
    if (updates.dose_amount_taken === "" || updates.dose_amount_taken === null)
      updates.dose_amount_taken = null;
  }

  updates.recorded_by_user_id = userId;

  await event.update(updates);
  await event.reload();
  return event.get({ plain: true });
};

const listIntakeEventsForSummary = async (userId, profileId, query) => {
  const { role } = await getProfileAccess(userId, profileId);
  if (!["owner", "caregiver", "viewer"].includes(role)) {
    throw httpError("Không có quyền", 403);
  }

  const from = parseDate(query.from || query.from_datetime, "from_datetime");
  const to = parseDate(query.to || query.to_datetime, "to_datetime");
  if (from.getTime() > to.getTime()) {
    throw httpError("from_datetime phải <= to_datetime", 400);
  }

  const includeFuture =
    String(query.include_future || "false").toLowerCase() === "true" ||
    String(query.include_future || "0") === "1";

  // nếu không include future: effectiveTo = min(to, now)
  const now = new Date();
  const effectiveTo = includeFuture
    ? to
    : new Date(Math.min(to.getTime(), now.getTime()));

  const where = {
    profile_id: profileId,
    scheduled_time: { [Op.gte]: from, [Op.lte]: effectiveTo },
  };

  if (query.regimen_id) where.regimen_id = query.regimen_id;

  // Không filter status để FE tự tính % taken/total
  const events = await MedicationIntakeEvent.findAll({
    where,
    order: [
      ["scheduled_time", "ASC"],
      ["created_at", "ASC"],
    ],
  });

  return events.map((e) => e.get({ plain: true }));
};

module.exports = {
  listIntakeEventsInRange,
  updateIntakeEventCheckin,
  listIntakeEventsForSummary,
};
