const { Op } = require("sequelize");
const {
  sequelize,
  PatientProfile,
  MedicationRegimen,
  DrugProduct,
  MedicationIntakeEvent,
} = require("../models");
const { assertPremiumUser } = require("./subscription.service");
const { assertProfileRole } = require("./profile-access.service");
const medicationSafetyService = require("./medication-safety.service");
const {
  buildPatientProfilePdfBuffer,
} = require("../utils/profile-pdf.builder");

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const normalizeRangeDays = (rangeDays) => {
  const n = Number(rangeDays);
  if (![7, 30, 90].includes(n)) return 30;
  return n;
};

const normalizeMode = (mode) => {
  const m = String(mode || "").toLowerCase();
  return ["summary", "full"].includes(m) ? m : "summary";
};

const exportPatientProfilePdf = async (userId, profileId, opts = {}) => {
  const mode = normalizeMode(opts.mode);
  const rangeDays = normalizeRangeDays(opts.rangeDays);

  // Cho viewer/caregiver/owner export (đổi allowedRoles nếu muốn chặt hơn)
  await assertProfileRole(userId, profileId, ["owner", "caregiver", "viewer"]);
  // Premium-only cho chức năng xuất PDF
  await assertPremiumUser(userId, "chức năng xuất PDF");
  const profile = await PatientProfile.findByPk(profileId);
  if (!profile) throw httpError("Không tìm thấy hồ sơ bệnh nhân", 404);

  // Regimens active + join drugProduct
  const regimens = await MedicationRegimen.findAll({
    where: {
      profile_id: profileId,
      is_active: true,
      [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
    },
    attributes: [
      "id",
      "display_name",
      "total_daily_dose",
      "dose_unit",
      "start_date",
      "end_date",
      "schedule_type",
      "schedule_payload",
      "timezone",
      "drug_product_id",
    ],
    include: [
      {
        model: DrugProduct,
        as: "drugProduct",
        required: false,
        attributes: ["id", "brand_name", "form", "route", "strength_text"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Intake stats (rangeDays)
  const to = new Date();
  const from = new Date(to.getTime() - rangeDays * 24 * 60 * 60 * 1000);

  const intakeCounts = await MedicationIntakeEvent.findAll({
    where: {
      profile_id: profileId,
      scheduled_time: { [Op.between]: [from, to] },
    },
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const adherence = {
    from: from.toISOString(),
    to: to.toISOString(),
    taken: 0,
    skipped: 0,
    delayed: 0,
    unknown: 0,
    total: 0,
    takenPercent: 0,
  };

  for (const row of intakeCounts) {
    const status = String(row.status || "unknown").toLowerCase();
    const count = Number(row.count || 0);
    if (["taken", "skipped", "delayed", "unknown"].includes(status)) {
      adherence[status] += count;
      adherence.total += count;
    }
  }
  if (adherence.total > 0) {
    adherence.takenPercent = Math.round(
      (adherence.taken / adherence.total) * 100,
    );
  }

  // Warnings (dùng service sẵn có)
  const warnings = await medicationSafetyService.getMedicationWarnings(
    userId,
    profileId,
    { include_inactive: "false" },
  );

  const payload = {
    mode,
    rangeDays,
    profile: profile.get({ plain: true }),
    regimens: regimens.map((r) => r.get({ plain: true })),
    adherence,
    warnings,
  };

  const pdfBuffer = await buildPatientProfilePdfBuffer(payload);

  const filename = `patient-profile-${profileId}-${Date.now()}.pdf`;

  // JSON base64: dễ nhất cho Expo
  return {
    filename,
    mime: "application/pdf",
    base64: pdfBuffer.toString("base64"),
  };
};

module.exports = { exportPatientProfilePdf };
