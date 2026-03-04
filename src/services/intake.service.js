const { Op } = require("sequelize");
const {
  sequelize,
  MedicationIntakeEvent,
  MedicationRegimen,
  PatientProfile,
  ProfileShare,
  DrugProduct,
} = require("../models");
const { DateTime } = require("luxon");

const httpError = (message, statusCode, details) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
};

/**
 * Tự động tạo MedicationIntakeEvent cho một regimen
 * @param {Object} regimen - MedicationRegimen object với đầy đủ thông tin
 * @param {Object} transaction - Optional Sequelize transaction
 * @returns {Promise<Array>} - Array of created MedicationIntakeEvent records
 */
const generateIntakeEventsForRegimen = async (regimen, transaction = null) => {
  try {
    // Validate input
    if (!regimen || !regimen.id || !regimen.profile_id) {
      throw new Error("Invalid regimen object");
    }

    const {
      id: regimenId,
      profile_id: profileId,
      start_date,
      end_date,
      schedule_payload,
      timezone,
    } = regimen;

    // Validate schedule_payload.times
    if (!schedule_payload || !Array.isArray(schedule_payload.times)) {
      console.warn(
        `[generateIntakeEvents] Regimen ${regimenId} không có schedule_payload.times, bỏ qua`,
      );
      return [];
    }

    const times = schedule_payload.times;
    if (times.length === 0) {
      console.warn(
        `[generateIntakeEvents] Regimen ${regimenId} có times array rỗng, bỏ qua`,
      );
      return [];
    }

    const tz = timezone || "Asia/Ho_Chi_Minh";

    // Parse start_date và end_date
    const startDT = DateTime.fromJSDate(new Date(start_date), { zone: tz });
    const endDT = DateTime.fromJSDate(new Date(end_date), { zone: tz });

    if (!startDT.isValid || !endDT.isValid) {
      throw new Error("Invalid start_date or end_date");
    }

    // Tạo array để bulk insert
    const eventsToCreate = [];

    // Loop qua từng ngày từ start_date đến end_date
    let currentDay = startDT.startOf("day");
    const endDay = endDT.startOf("day");

    while (currentDay <= endDay) {
      // Với mỗi ngày, tạo events cho từng time trong times array
      for (const timeStr of times) {
        try {
          // Parse time string (format: "HH:mm")
          const [hour, minute] = timeStr.split(":").map(Number);

          if (
            isNaN(hour) ||
            isNaN(minute) ||
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59
          ) {
            console.warn(
              `[generateIntakeEvents] Invalid time format: ${timeStr}, skipping`,
            );
            continue;
          }

          // Tạo scheduled_time = ngày hiện tại + giờ từ times
          const scheduledTime = currentDay.set({
            hour,
            minute,
            second: 0,
            millisecond: 0,
          });

          eventsToCreate.push({
            regimen_id: regimenId,
            profile_id: profileId,
            scheduled_time: scheduledTime.toJSDate(),
            status: "unknown",
            taken_time: null,
            dose_amount_taken: null,
            notes: null,
            recorded_by_user_id: null,
          });
        } catch (err) {
          console.error(
            `[generateIntakeEvents] Error parsing time ${timeStr}:`,
            err,
          );
        }
      }

      // Chuyển sang ngày tiếp theo
      currentDay = currentDay.plus({ days: 1 });
    }

    // Bulk insert vào database
    if (eventsToCreate.length === 0) {
      console.warn(
        `[generateIntakeEvents] No events to create for regimen ${regimenId}`,
      );
      return [];
    }

    const createdEvents = await MedicationIntakeEvent.bulkCreate(
      eventsToCreate,
      {
        returning: true,
        transaction,
      },
    );

    console.log(
      `[generateIntakeEvents] ✅ Created ${createdEvents.length} intake events for regimen ${regimenId}`,
    );

    return createdEvents;
  } catch (error) {
    console.error(
      `[generateIntakeEvents] ❌ Error generating events for regimen ${regimen?.id}:`,
      error,
    );
    throw error;
  }
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
const normalizeTimezone = (value) => {
  const tz = String(value || "").trim() || "Asia/Ho_Chi_Minh";
  const probe = DateTime.now().setZone(tz);
  if (!probe.isValid) {
    throw httpError("timezone không hợp lệ", 400, { timezone: value });
  }
  return tz;
};

const computeDayRange = (tz, dateStr) => {
  if (dateStr != null && String(dateStr).trim() !== "") {
    const base = DateTime.fromISO(String(dateStr), { zone: tz }).startOf("day");
    if (!base.isValid) throw httpError("date không hợp lệ (YYYY-MM-DD)", 400);
    return { from: base, to: base.plus({ days: 1 }) };
  }

  const now = DateTime.now().setZone(tz);
  const from = now.startOf("day");
  return { from, to: from.plus({ days: 1 }) };
};

/**
 * Lấy các lần uống thuốc (intake events) trong ngày "hôm nay" theo timezone.
 * - Default timezone: Asia/Ho_Chi_Minh
 * - Có thể truyền query.date=YYYY-MM-DD để lấy 1 ngày cụ thể.
 * - Có thể truyền query.include_inactive=true để không lọc regimen.is_active
 * - Có thể truyền query.status / query.regimen_id để filter
 */
const listTodayIntakeEvents = async (userId, profileId, query = {}) => {
  const { role } = await getProfileAccess(userId, profileId);
  if (!["owner", "caregiver", "viewer"].includes(role)) {
    throw httpError("Không có quyền", 403);
  }

  const tz = normalizeTimezone(query.timezone || query.tz);
  const { from, to } = computeDayRange(tz, query.date);

  const where = {
    profile_id: profileId,
    scheduled_time: {
      [Op.gte]: from.toJSDate(),
      [Op.lt]: to.toJSDate(), // ✅ [startOfDay, nextDay) tránh bug ms
    },
  };

  if (query.status) where.status = query.status;
  if (query.regimen_id) where.regimen_id = query.regimen_id;

  const includeInactive =
    String(query.include_inactive || "false").toLowerCase() === "true" ||
    String(query.include_inactive || "0") === "1";

  const regimenInclude = {
    model: MedicationRegimen,
    as: "regimen",
    attributes: [
      "id",
      "display_name",
      "total_daily_dose",
      "dose_unit",
      "drug_product_id",
      "is_active",
      "timezone",
    ],
    required: true,
    include: [
      {
        model: DrugProduct,
        as: "drugProduct",
        attributes: ["id", "brand_name", "form", "route", "strength_text"],
        required: false,
      },
    ],
  };

  // ✅ mặc định: chỉ lấy regimen đang active (đúng “cần uống hôm nay”)
  if (!includeInactive) {
    regimenInclude.where = { is_active: true };
  }

  const events = await MedicationIntakeEvent.findAll({
    where,
    include: [regimenInclude],
    order: [
      ["scheduled_time", "ASC"],
      ["created_at", "ASC"],
    ],
  });

  return events.map((e) => e.get({ plain: true }));
};

const listIntakeEventsInRange = async (userId, profileId, query) => {
  console.log(userId, profileId, query);

  const { role } = await getProfileAccess(userId, profileId);
  if (!["owner", "caregiver", "viewer"].includes(role))
    throw httpError("Không có quyền", 403);

  const from = parseDate(query.from || query.from_datetime, "from_datetime");
  const to = parseDate(query.to || query.to_datetime, "to_datetime");
  if (from.getTime() > to.getTime())
    throw httpError("from_datetimeƯ phải <= to_datetime", 400);

  const where = {
    profile_id: profileId,
    scheduled_time: { [Op.between]: [from, to] },
  };

  if (query.status) where.status = query.status;
  if (query.regimen_id) where.regimen_id = query.regimen_id;

  const events = await MedicationIntakeEvent.findAll({
    where,
    include: [
      {
        model: MedicationRegimen,
        as: "regimen",
        attributes: ["display_name", "total_daily_dose", "dose_unit"],
      },
    ],
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
  listTodayIntakeEvents,
  listIntakeEventsInRange,
  updateIntakeEventCheckin,
  listIntakeEventsForSummary,
  generateIntakeEventsForRegimen,
};
