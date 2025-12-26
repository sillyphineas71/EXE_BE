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

const getIntakeAdherenceSummary = async (userId, profileId, query) => {
  const { role } = await getProfileAccess(userId, profileId);
  if (!["owner", "caregiver", "viewer"].includes(role))
    throw httpError("Không có quyền", 403);

  const from = parseDate(query.from || query.from_datetime, "from_datetime");
  const to = parseDate(query.to || query.to_datetime, "to_datetime");
  if (from.getTime() > to.getTime())
    throw httpError("from_datetime phải <= to_datetime", 400);

  const groupBy = (query.group_by || "day").toLowerCase();
  const unit =
    groupBy === "week" ? "week" : groupBy === "month" ? "month" : "day";

  const includeFuture =
    String(query.include_future || "false").toLowerCase() === "true" ||
    String(query.include_future || "0") === "1";

  const where = {
    profile_id: profileId,
    scheduled_time: {
      [Op.between]: [from, to],
    },
  };

  // mặc định không tính event tương lai (để ra “tuần này đã uống đúng X%”)
  if (!includeFuture) {
    where.scheduled_time = { ...where.scheduled_time, [Op.lte]: new Date() };
  }

  if (query.regimen_id) where.regimen_id = query.regimen_id;

  // bỏ các record thiếu scheduled_time (nếu có)
  where.scheduled_time = { ...where.scheduled_time, [Op.not]: null };

  const bucketExpr = sequelize.fn(
    "date_trunc",
    unit,
    sequelize.col("scheduled_time")
  );

  const rows = await MedicationIntakeEvent.findAll({
    where,
    attributes: [
      [bucketExpr, "bucket_start"],
      [sequelize.fn("COUNT", sequelize.col("id")), "total_scheduled"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(`CASE WHEN status='taken' THEN 1 ELSE 0 END`)
        ),
        "taken",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(`CASE WHEN status='skipped' THEN 1 ELSE 0 END`)
        ),
        "skipped",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(`CASE WHEN status='delayed' THEN 1 ELSE 0 END`)
        ),
        "delayed",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal(`CASE WHEN status='unknown' THEN 1 ELSE 0 END`)
        ),
        "unknown",
      ],
    ],
    group: [bucketExpr],
    order: [[bucketExpr, "ASC"]],
    raw: true,
  });

  const series = rows.map((r) => {
    const total = Number(r.total_scheduled || 0);
    const taken = Number(r.taken || 0);
    const skipped = Number(r.skipped || 0);
    const delayed = Number(r.delayed || 0);
    const unknown = Number(r.unknown || 0);
    const adherenceRate =
      total > 0 ? Math.round((taken / total) * 1000) / 10 : 0;

    return {
      bucket_start: new Date(r.bucket_start).toISOString(),
      total_scheduled: total,
      taken,
      skipped,
      delayed,
      unknown,
      adherence_rate: adherenceRate,
    };
  });

  const totals = series.reduce(
    (acc, cur) => {
      acc.total_scheduled += cur.total_scheduled;
      acc.taken += cur.taken;
      acc.skipped += cur.skipped;
      acc.delayed += cur.delayed;
      acc.unknown += cur.unknown;
      return acc;
    },
    { total_scheduled: 0, taken: 0, skipped: 0, delayed: 0, unknown: 0 }
  );

  totals.adherence_rate =
    totals.total_scheduled > 0
      ? Math.round((totals.taken / totals.total_scheduled) * 1000) / 10
      : 0;

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      group_by: unit,
      include_future: includeFuture,
      regimen_id: query.regimen_id || null,
    },
    totals,
    series,
  };
};

module.exports = {
  listIntakeEventsInRange,
  updateIntakeEventCheckin,
  getIntakeAdherenceSummary,
};
