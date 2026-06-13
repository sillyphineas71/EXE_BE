// const { Op } = require("sequelize");
// const {
//   sequelize,
//   User,
//   PatientProfile,
//   ProfileShare,
//   MedicationRegimen,
//   PrescriptionItem,
//   DrugProduct,
// } = require("../models/index");
// const { DateTime } = require("luxon");
// const { generateIntakeEventsForRegimen } = require("./intake.service");


// const httpError = (message, statusCode) => {
//   const error = new Error(message);
//   error.statusCode = statusCode;
//   return error;
// };
// const checkAccess = async (userId, profileId) => {
//   const profile = await PatientProfile.findOne({
//     where: {
//       id: profileId,
//       [Op.or]: [{ owner_user_id: userId }, { "$shares.user_id$": userId }],
//     },
//     include: [
//       {
//         model: ProfileShare,
//         as: "shares",
//         required: false,
//         where: { user_id: userId },
//       },
//     ],
//   });

//   if (!profile) {
//     throw httpError(
//       "Hồ sơ không tồn tại hoặc bạn không có quyền truy cập",
//       403
//     );
//   }
//   return profile;
// };


// const createRegimes = async (userId, profileId, data) => {
//   const {
//     prescription_item_id,
//     drug_product_id,
//     display_name,
//     total_daily_dose,
//     dose_unit,
//     start_date,
//     duration_days,
//     schedule_type,
//     schedule_payload,
//     timezone,
//   } = data;

//   await checkAccess(userId, profileId);

//   if (!["fixed_times", "interval_hours", "custom"].includes(schedule_type)) {
//     throw httpError("Loại lịch (schedule_type) không hợp lệ", 400);
//   }

//   if (prescription_item_id) {
//     const itemExist = await PrescriptionItem.findByPk(prescription_item_id);
//     if (!itemExist) {
//       throw httpError("Dòng thuốc trong đơn không tồn tại", 400);
//     }
//   }

//   // ✅ Validate duration_days
//   if (duration_days == null) {
//     throw httpError("Thiếu duration_days (số ngày dùng thuốc)", 400);
//   }
//   const days = Number(duration_days);
//   if (!Number.isInteger(days) || days <= 0) {
//     throw httpError("duration_days phải là số nguyên dương", 400);
//   }
//   // (tuỳ bạn) giới hạn để tránh nhập bậy
//   if (days > 3650) {
//     throw httpError("duration_days quá lớn", 400);
//   }

//   const tz = timezone || "Asia/Ho_Chi_Minh";

//   // ✅ Parse + normalize start_date theo timezone
//   // Nếu không nhập start_date thì lấy "hôm nay" theo timezone, startOf('day')
//   const startDT = start_date
//     ? DateTime.fromISO(start_date, { zone: tz })
//     : DateTime.now().setZone(tz);

//   if (!startDT.isValid) {
//     throw httpError("start_date không hợp lệ (ISO string)", 400);
//   }

//   // Nếu start_date là ngày bắt đầu uống -> chuẩn hoá về đầu ngày
//   const start = startDT.startOf("day");

//   // ✅ end_date inclusive: ngày cuối uống = start + (days - 1) và set cuối ngày
//   const end = start.plus({ days: days - 1 }).endOf("day");

//   // Sử dụng transaction để đảm bảo data consistency
//   const transaction = await sequelize.transaction();

//   try {
//     const newRegimen = await MedicationRegimen.create(
//       {
//         profile_id: profileId,
//         prescription_item_id: prescription_item_id || null,
//         drug_product_id,
//         display_name,
//         total_daily_dose,
//         dose_unit,
//         start_date: start.toJSDate(),
//         end_date: end.toJSDate(),
//         is_active: true,
//         schedule_type,
//         schedule_payload,
//         timezone: tz,
//         created_by_user_id: userId,
//       },
//       { transaction }
//     );

//     // ✅ Tự động tạo MedicationIntakeEvent
//     await generateIntakeEventsForRegimen(newRegimen, transaction);

//     // Commit transaction
//     await transaction.commit();

//     return newRegimen;
//   } catch (error) {
//     // Rollback nếu có lỗi
//     await transaction.rollback();
//     console.error("[createRegimes] Error:", error);
//     throw error;
//   }
// };

// const getRegimensByProfile = async (userId, profileId, is_active) => {
//   await checkAccess(userId, profileId);

//   let whereClause = { profile_id: profileId };

//   if (is_active === "false") {
//     whereClause.is_active = false;
//   } else if (is_active === "all") {
//   } else {
//     whereClause.is_active = true;
//   }

//   const regimens = await MedicationRegimen.findAll({
//     where: whereClause,
//     attributes: [
//       "id",
//       "display_name",
//       "total_daily_dose",
//       "dose_unit",
//       "start_date",
//       "end_date",
//       "schedule_type",
//       "is_active",
//       "schedule_payload",
//     ],
//     order: [
//       ["is_active", "DESC"],
//       ["created_at", "DESC"],
//     ],
//   });

//   return regimens;
// };
// const getRegimenDetail = async (userId, regimenId) => {
//   const regimen = await MedicationRegimen.findByPk(regimenId, {
//     include: [
//       {
//         model: DrugProduct,
//         as: "drugProduct",
//         attributes: ["id", "brand_name"],
//       },
//     ],
//   });
//   if (!regimen) {
//     throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
//   }

//   await checkAccess(userId, regimen.profile_id);

//   return regimen;
// };
// const updateRegimen = async (userId, regimenId, data) => {
//   const regimen = await MedicationRegimen.findByPk(regimenId);
//   if (!regimen) {
//     throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
//   }
//   await checkAccess(userId, regimen.profile_id);

//   const {
//     display_name,
//     total_daily_dose,
//     dose_unit,
//     start_date,
//     end_date,
//     schedule_type,
//     schedule_payload,
//     timezone,
//   } = data;

//   if (
//     schedule_type &&
//     !["fixed_times", "interval_hours", "custom"].includes(schedule_type)
//   ) {
//     throw httpError("Loại lịch (schedule_type) không hợp lệ", 400);
//   }

//   if (display_name !== undefined) regimen.display_name = display_name;
//   if (total_daily_dose !== undefined)
//     regimen.total_daily_dose = total_daily_dose;
//   if (dose_unit !== undefined) regimen.dose_unit = dose_unit;
//   if (start_date !== undefined) regimen.start_date = start_date;
//   if (end_date !== undefined) regimen.end_date = end_date;
//   if (schedule_type !== undefined) regimen.schedule_type = schedule_type;
//   if (schedule_payload !== undefined)
//     regimen.schedule_payload = schedule_payload;
//   if (timezone !== undefined) regimen.timezone = timezone;

//   await regimen.save();
//   return regimen;
// };
// const stopRegimen = async (userId, regimenId) => {
//   const regimen = await MedicationRegimen.findByPk(regimenId);

//   if (!regimen) {
//     throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
//   }
//   await checkAccess(userId, regimen.profile_id);

//   if (regimen.is_active === false) {
//     throw httpError("Thuốc này đã được ngừng trước đó rồi", 400);
//   }

//   regimen.is_active = false;

//   regimen.end_date = new Date();

//   await regimen.save();

//   return true;
// };
// module.exports = {
//   createRegimes,
//   getRegimensByProfile,
//   getRegimenDetail,
//   updateRegimen,
//   stopRegimen,
// };

const { Op } = require("sequelize");
const {
  sequelize,
  PatientProfile,
  ProfileShare,
  MedicationRegimen,
  PrescriptionItem,
  DrugProduct,
  MedicationIntakeEvent,
} = require("../models/index");
const { DateTime } = require("luxon");
const { generateIntakeEventsForRegimen } = require("./intake.service");

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
      403,
    );
  }

  // Resolve effective role for permission checks
  let role = "owner";
  const selfShare = Array.isArray(profile.shares) ? profile.shares[0] : null;
  if (String(profile.owner_user_id) !== String(userId)) {
    role = String(selfShare?.role || "viewer").toLowerCase();
    if (!["caregiver", "viewer"].includes(role)) role = "viewer";
  }

  return { profile, role };
};

const normalizeTimes = (times) => {
  if (!Array.isArray(times) || times.length === 0) {
    throw httpError("schedule_payload.times là bắt buộc", 400);
  }

  const cleaned = times.map((t) => String(t || "").trim()).filter(Boolean);

  if (cleaned.length === 0) {
    throw httpError("schedule_payload.times không được rỗng", 400);
  }

  for (const t of cleaned) {
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(t)) {
      throw httpError("Giờ nhắc phải theo định dạng HH:mm", 400);
    }
  }

  // unique + sort
  return Array.from(new Set(cleaned)).sort();
};

const parseStartDate = (value, tz) => {
  // value can be ISO date string (YYYY-MM-DD) or ISO datetime
  if (!value) return DateTime.now().setZone(tz).startOf("day");

  const dt = DateTime.fromISO(String(value), { zone: tz });
  if (!dt.isValid) throw httpError("start_date không hợp lệ (ISO)", 400);
  return dt.startOf("day");
};

const parseDurationDays = (value) => {
  if (value == null) {
    throw httpError("Thiếu duration_days (số ngày dùng thuốc)", 400);
  }

  const days = Number(value);
  if (!Number.isInteger(days) || days <= 0) {
    throw httpError("duration_days phải là số nguyên dương", 400);
  }

  if (days > 3650) {
    throw httpError("duration_days quá lớn", 400);
  }

  return days;
};

/**
 * Regenerate future intake events (from today) for a regimen.
 * - Keep history (taken/skipped/past events).
 * - Rebuild from today's start (timezone aware).
 */
const regenerateFutureIntakeEvents = async (regimen, transaction) => {
  const tz = regimen.timezone || "Asia/Ho_Chi_Minh";
  const times = normalizeTimes(regimen.schedule_payload?.times);

  // regimen.start_date/end_date are DATEONLY in DB. They may come back as string.
  const startDT = DateTime.fromISO(String(regimen.start_date), {
    zone: tz,
  }).startOf("day");

  if (!startDT.isValid) {
    throw httpError("start_date không hợp lệ", 400);
  }

  const endValue = regimen.end_date;
  if (!endValue) {
    // Not supported in Phase 1/2
    throw httpError(
      "end_date đang rỗng (chưa hỗ trợ regimen vô thời hạn)",
      400,
    );
  }

  const endDT = DateTime.fromISO(String(endValue), { zone: tz }).startOf("day");
  if (!endDT.isValid) {
    throw httpError("end_date không hợp lệ", 400);
  }

  const todayStart = DateTime.now().setZone(tz).startOf("day");
  const fromDay = todayStart > startDT ? todayStart : startDT;

  // Delete future unknown/delayed events so we can rebuild.
  await MedicationIntakeEvent.destroy({
    where: {
      regimen_id: regimen.id,
      scheduled_time: { [Op.gte]: fromDay.toJSDate() },
      status: { [Op.in]: ["unknown", "delayed"] },
    },
    transaction,
  });

  // Build new events
  const eventsToCreate = [];

  let currentDay = fromDay;
  const lastDay = endDT;

  while (currentDay <= lastDay) {
    for (const timeStr of times) {
      const [hour, minute] = timeStr.split(":").map(Number);
      const scheduledTime = currentDay.set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

      eventsToCreate.push({
        regimen_id: regimen.id,
        profile_id: regimen.profile_id,
        scheduled_time: scheduledTime.toJSDate(),
        status: "unknown",
        taken_time: null,
        dose_amount_taken: null,
        notes: null,
        recorded_by_user_id: null,
      });
    }

    currentDay = currentDay.plus({ days: 1 });
  }

  if (eventsToCreate.length > 0) {
    await MedicationIntakeEvent.bulkCreate(eventsToCreate, {
      transaction,
    });
  }
};

const createRegimes = async (userId, profileId, data) => {
  const startTime = Date.now();
  console.log(`[PERFORMANCE BẮT ĐẦU] Bắt đầu gọi createRegimes cho profile: ${profileId}`);
  const {
    prescription_item_id,
    drug_product_id,
    display_name,
    total_daily_dose,
    dose_unit,
    start_date,
    duration_days,
    schedule_type,
    schedule_payload,
    timezone,
  } = data;

  const { role } = await checkAccess(userId, profileId);
  if (!["owner", "caregiver"].includes(role)) {
    throw httpError("Bạn không có quyền tạo kế hoạch dùng thuốc", 403);
  }

  // Phase 1/2: only fixed_times is supported end-to-end
  if (schedule_type && schedule_type !== "fixed_times") {
    throw httpError("Hiện tại chỉ hỗ trợ schedule_type = fixed_times", 400);
  }

  if (!display_name || !String(display_name).trim()) {
    throw httpError("display_name là bắt buộc", 400);
  }

  if (drug_product_id) {
    const dp = await DrugProduct.findByPk(drug_product_id);
    if (!dp) {
      throw httpError("drug_product_id không tồn tại", 400);
    }
  }

  if (prescription_item_id) {
    const itemExist = await PrescriptionItem.findByPk(prescription_item_id);
    if (!itemExist) {
      throw httpError("Dòng thuốc trong đơn không tồn tại", 400);
    }
  }

  const days = parseDurationDays(duration_days);
  const tz = timezone || "Asia/Ho_Chi_Minh";

  const start = parseStartDate(start_date, tz);
  const end = start.plus({ days: days - 1 }).startOf("day");

  // Validate times
  const times = normalizeTimes(schedule_payload?.times);

  const transaction = await sequelize.transaction();

  try {
    const newRegimen = await MedicationRegimen.create(
      {
        profile_id: profileId,
        prescription_item_id: prescription_item_id || null,
        drug_product_id: drug_product_id || null,
        display_name: String(display_name).trim(),
        total_daily_dose: total_daily_dose ?? null,
        dose_unit: dose_unit ?? null,
        start_date: start.toISODate(),
        end_date: end.toISODate(),
        is_active: true,
        schedule_type: "fixed_times",
        schedule_payload: { ...schedule_payload, times },
        timezone: tz,
        created_by_user_id: userId,
      },
      { transaction },
    );

    const createDbTime = Date.now();
    console.log(`[PERFORMANCE QUERY] Chạy từ đầu tới trước lúc sinh sự kiện (Intake) mất: ${createDbTime - startTime}ms`);

    // create intake events for full range
    await generateIntakeEventsForRegimen(newRegimen, transaction);
    const afterIntakeTime = Date.now();
    console.log(`[PERFORMANCE INTAKE] Hàm generateIntakeEventsForRegimen mất: ${afterIntakeTime - createDbTime}ms để chạy xong`);
    await transaction.commit();

    return newRegimen;
  } catch (error) {
    await transaction.rollback();
    const errorTime = Date.now() - startTime;
    console.error(`[PERFORMANCE LỖI] ❌ Hàm văng lỗi sau: ${errorTime}ms (~${(errorTime/1000).toFixed(2)} giây). Chi tiết lỗi:`, error);
    throw error;
  }
};

const getRegimensByProfile = async (userId, profileId, is_active) => {
  await checkAccess(userId, profileId);

  const whereClause = { profile_id: profileId };

  if (is_active === "false") {
    whereClause.is_active = false;
  } else if (is_active === "all") {
    // no filter
  } else {
    whereClause.is_active = true;
  }

  const regimens = await MedicationRegimen.findAll({
    where: whereClause,
    attributes: [
      "id",
      "display_name",
      "total_daily_dose",
      "dose_unit",
      "start_date",
      "end_date",
      "schedule_type",
      "is_active",
      "schedule_payload",
      "timezone",
    ],
    order: [
      ["is_active", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return regimens;
};

const getRegimenDetail = async (userId, regimenId) => {
  const regimen = await MedicationRegimen.findByPk(regimenId, {
    include: [
      {
        model: DrugProduct,
        as: "drugProduct",
        attributes: ["id", "brand_name"],
      },
    ],
  });

  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }

  await checkAccess(userId, regimen.profile_id);

  return regimen;
};

const updateRegimen = async (userId, regimenId, data) => {
  const regimen = await MedicationRegimen.findByPk(regimenId);
  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }

  const access = await checkAccess(userId, regimen.profile_id);
  if (!["owner", "caregiver"].includes(access.role)) {
    throw httpError("Bạn không có quyền cập nhật kế hoạch dùng thuốc", 403);
  }

  // Keep old values to detect changes
  const old = {
    start_date: regimen.start_date,
    end_date: regimen.end_date,
    schedule_payload: regimen.schedule_payload,
    timezone: regimen.timezone,
    is_active: regimen.is_active,
  };

  const {
    display_name,
    total_daily_dose,
    dose_unit,
    start_date,
    duration_days,
    end_date,
    schedule_type,
    schedule_payload,
    timezone,
    is_active,
  } = data;

  // Phase 1/2: only fixed_times supported
  if (schedule_type && schedule_type !== "fixed_times") {
    throw httpError("Hiện tại chỉ hỗ trợ schedule_type = fixed_times", 400);
  }

  const transaction = await sequelize.transaction();

  try {
    if (display_name !== undefined) regimen.display_name = display_name;
    if (total_daily_dose !== undefined)
      regimen.total_daily_dose = total_daily_dose;
    if (dose_unit !== undefined) regimen.dose_unit = dose_unit;

    if (timezone !== undefined) {
      const tz = String(timezone || "").trim();
      if (!tz) throw httpError("timezone không hợp lệ", 400);
      regimen.timezone = tz;
    }

    // allow activate/deactivate
    if (is_active !== undefined) regimen.is_active = !!is_active;

    // schedule payload
    if (schedule_payload !== undefined) {
      const times = normalizeTimes(schedule_payload?.times);
      regimen.schedule_payload = { ...schedule_payload, times };
      regimen.schedule_type = "fixed_times";
    }

    // start/end/duration
    const tzForDates = regimen.timezone || "Asia/Ho_Chi_Minh";

    let nextStart = regimen.start_date;

    if (start_date !== undefined && start_date !== null && start_date !== "") {
      const s = parseStartDate(start_date, tzForDates);
      nextStart = s.toISODate();
      regimen.start_date = nextStart;
    }

    if (
      duration_days !== undefined &&
      duration_days !== null &&
      duration_days !== ""
    ) {
      const days = parseDurationDays(duration_days);
      const sdt = DateTime.fromISO(String(nextStart), {
        zone: tzForDates,
      }).startOf("day");
      const edt = sdt.plus({ days: days - 1 }).startOf("day");
      regimen.end_date = edt.toISODate();
    } else if (end_date !== undefined) {
      // allow explicit end_date update (ISO date)
      if (end_date === null || end_date === "") {
        // not supported in phase 1/2
        throw httpError("end_date rỗng (chưa hỗ trợ regimen vô thời hạn)", 400);
      }
      const edt = DateTime.fromISO(String(end_date), {
        zone: tzForDates,
      }).startOf("day");
      if (!edt.isValid) throw httpError("end_date không hợp lệ", 400);
      regimen.end_date = edt.toISODate();
    }

    regimen.updated_at = new Date();

    await regimen.save({ transaction });
    await regimen.reload({ transaction });

    const changedSchedule =
      JSON.stringify(old.schedule_payload || {}) !==
      JSON.stringify(regimen.schedule_payload || {});
    const changedDates =
      String(old.start_date || "") !== String(regimen.start_date || "") ||
      String(old.end_date || "") !== String(regimen.end_date || "");
    const changedTz =
      String(old.timezone || "") !== String(regimen.timezone || "");

    const becameActive = old.is_active === false && regimen.is_active === true;

    // Regenerate future intake events if schedule/dates/tz changed OR regimen re-activated.
    if (
      regimen.is_active &&
      (changedSchedule || changedDates || changedTz || becameActive)
    ) {
      await regenerateFutureIntakeEvents(regimen, transaction);
    }

    await transaction.commit();

    return regimen;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const stopRegimen = async (userId, regimenId) => {
  const regimen = await MedicationRegimen.findByPk(regimenId);

  if (!regimen) {
    throw httpError("Kế hoạch dùng thuốc không tồn tại", 404);
  }

  const access = await checkAccess(userId, regimen.profile_id);
  if (!["owner", "caregiver"].includes(access.role)) {
    throw httpError("Bạn không có quyền ngừng kế hoạch dùng thuốc", 403);
  }

  if (regimen.is_active === false) {
    throw httpError("Thuốc này đã được ngừng trước đó rồi", 400);
  }

  regimen.is_active = false;
  // Đồng bộ end_date về hôm nay (theo timezone regimen) để query/cron/report nhất quán.
  const tz = regimen.timezone || "Asia/Ho_Chi_Minh";
  const todayYmd = DateTime.now().setZone(tz).toISODate();
  if (!regimen.end_date || String(regimen.end_date) > String(todayYmd)) {
    regimen.end_date = todayYmd;
  }
  regimen.updated_at = new Date();
  await regimen.save();

  return true;
};
const getRegimensByProfileInUse = async (userId, profileId, query = {}) => {
  await checkAccess(userId, profileId);

  const tz =
    String(query.timezone || "Asia/Ho_Chi_Minh").trim() || "Asia/Ho_Chi_Minh";
  const probe = DateTime.now().setZone(tz);
  if (!probe.isValid) {
    throw httpError("timezone không hợp lệ", 400);
  }

  // today theo timezone, dạng YYYY-MM-DD (match DATEONLY)
  const today = probe.toISODate();

  const whereClause = {
    profile_id: profileId,
    is_active: true,
    [Op.and]: [
      { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }] },
      { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
    ],
  };

  const regimens = await MedicationRegimen.findAll({
    where: whereClause,
    attributes: [
      "id",
      "drug_product_id", // ✅ thêm field này
      "display_name",
      "total_daily_dose",
      "dose_unit",
      "start_date",
      "end_date",
      "schedule_type",
      "is_active",
      "schedule_payload",
      "timezone",
    ],
    include: [
      {
        model: DrugProduct,
        as: "drugProduct", // ✅ alias đúng theo models/index.js
        required: false,
        attributes: [
          "id",
          "brand_name",
          "form",
          "route",
          "strength_text",
          "manufacturer",
          "country",
          "is_generic",
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return regimens;
};
module.exports = {
  createRegimes,
  getRegimensByProfile,
  getRegimenDetail,
  updateRegimen,
  stopRegimen,
  getRegimensByProfileInUse,
};
