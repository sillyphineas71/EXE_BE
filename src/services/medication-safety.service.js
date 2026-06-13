// const { Op } = require("sequelize");
// const {
//   MedicationRegimen,
//   DrugProduct,
//   Substance,
//   DrugInteraction,
//   RefSource,
// } = require("../models");
// const { assertProfileRole } = require("./profile-access.service");

// const httpError = (message, statusCode) => {
//   const error = new Error(message);
//   error.statusCode = statusCode;
//   return error;
// };

// const normalizeSeverityRank = (s) => {
//   const v = String(s || "").toLowerCase();
//   const order = {
//     contraindicated: 4,
//     severe: 3,
//     moderate: 2,
//     mild: 1,
//   };
//   return order[v] || 0;
// };

// /**
//  * Compute safety warnings for a profile.
//  * - duplicates: same substance appears in >1 active regimens
//  * - interactions: pairs of substances with interaction records
//  */
// const getMedicationWarnings = async (userId, profileId, options = {}) => {
//   await assertProfileRole(userId, profileId, ["owner", "caregiver", "viewer"]);

//   const includeInactive =
//     String(options.include_inactive || "false").toLowerCase() === "true";

//   const now = new Date();

//   const where = {
//     profile_id: profileId,
//   };

//   if (!includeInactive) {
//     where.is_active = true;
//     // DATEONLY fields in sequelize may compare as date; keep it simple.
//     where[Op.or] = [{ end_date: null }, { end_date: { [Op.gte]: now } }];
//   }

//   const regimens = await MedicationRegimen.findAll({
//     where,
//     attributes: [
//       "id",
//       "display_name",
//       "drug_product_id",
//       "total_daily_dose",
//       "dose_unit",
//       "start_date",
//       "end_date",
//       "is_active",
//     ],
//     include: [
//       {
//         model: DrugProduct,
//         as: "drugProduct",
//         attributes: ["id", "brand_name", "form", "route", "strength_text"],
//         required: false,
//         include: [
//           {
//             model: Substance,
//             as: "substances",
//             attributes: [
//               "id",
//               "name",
//               "atc_code",
//               "source_id",
//               "last_reviewed_at",
//             ],
//             through: { attributes: ["strength_value", "strength_unit"] },
//             include: [
//               {
//                 model: RefSource,
//                 as: "source",
//                 attributes: ["id", "name", "url"],
//                 required: false,
//               },
//             ],
//           },
//         ],
//       },
//     ],
//     order: [["created_at", "DESC"]],
//   });

//   // Build substance usage map
//   const substanceUse = new Map();

//   for (const r of regimens) {
//     const rr = r.get({ plain: true });
//     const subs = rr?.drugProduct?.substances || [];
//     for (const s of subs) {
//       const sid = s.id;
//       if (!sid) continue;
//       if (!substanceUse.has(sid)) {
//         substanceUse.set(sid, {
//           substance: {
//             id: s.id,
//             name: s.name,
//             atc_code: s.atc_code,
//             last_reviewed_at: s.last_reviewed_at,
//             source: s.source || null,
//           },
//           regimens: [],
//         });
//       }
//       substanceUse.get(sid).regimens.push({
//         regimen_id: rr.id,
//         regimen_name: rr.display_name,
//         drug_product_id: rr.drug_product_id,
//         drug_brand_name: rr?.drugProduct?.brand_name || null,
//       });
//     }
//   }

//   const substancesInUse = Array.from(substanceUse.values()).map(
//     (x) => x.substance,
//   );

//   const duplicates = Array.from(substanceUse.values())
//     .filter((x) => (x.regimens || []).length > 1)
//     .map((x) => ({
//       substance: x.substance,
//       count: x.regimens.length,
//       regimens: x.regimens,
//     }))
//     .sort((a, b) => b.count - a.count);

//   const substanceIds = Array.from(substanceUse.keys());

//   let interactions = [];

//   if (substanceIds.length >= 2) {
//     const rows = await DrugInteraction.findAll({
//       where: {
//         [Op.or]: [
//           {
//             substance_id_1: { [Op.in]: substanceIds },
//             substance_id_2: { [Op.in]: substanceIds },
//           },
//           {
//             substance_id_2: { [Op.in]: substanceIds },
//             substance_id_1: { [Op.in]: substanceIds },
//           },
//         ],
//       },
//       include: [
//         {
//           model: Substance,
//           as: "primarySubstance",
//           attributes: [
//             "id",
//             "name",
//             "atc_code",
//             "source_id",
//             "last_reviewed_at",
//           ],
//           include: [
//             {
//               model: RefSource,
//               as: "source",
//               attributes: ["id", "name", "url"],
//               required: false,
//             },
//           ],
//         },
//         {
//           model: Substance,
//           as: "secondarySubstance",
//           attributes: [
//             "id",
//             "name",
//             "atc_code",
//             "source_id",
//             "last_reviewed_at",
//           ],
//           include: [
//             {
//               model: RefSource,
//               as: "source",
//               attributes: ["id", "name", "url"],
//               required: false,
//             },
//           ],
//         },
//         {
//           model: RefSource,
//           as: "source",
//           attributes: ["id", "name", "url"],
//           required: false,
//         },
//       ],
//     });

//     // Deduplicate symmetric results
//     const seen = new Set();

//     interactions = rows
//       .map((row) => row.get({ plain: true }))
//       .map((it) => {
//         const a = it.primarySubstance;
//         const b = it.secondarySubstance;
//         const key = [a?.id, b?.id].sort().join("-");
//         return { key, ...it };
//       })
//       .filter((it) => {
//         if (!it.key) return false;
//         if (seen.has(it.key)) return false;
//         seen.add(it.key);
//         return true;
//       })
//       .map((it) => ({
//         id: it.id,
//         severity: it.severity,
//         description: it.description,
//         management: it.management,
//         substance_1: it.primarySubstance,
//         substance_2: it.secondarySubstance,
//         source: it.source || null,
//         created_at: it.created_at,
//         updated_at: it.updated_at,
//       }))
//       .sort(
//         (a, b) =>
//           normalizeSeverityRank(b.severity) - normalizeSeverityRank(a.severity),
//       );
//   }

//   return {
//     profile_id: profileId,
//     as_of: new Date().toISOString(),
//     regimens_count: regimens.length,
//     substances_in_use: substancesInUse,
//     duplicates,
//     interactions,
//   };
// };

// module.exports = {
//   getMedicationWarnings,
// };

const { Op } = require("sequelize");
const {
  MedicationRegimen,
  PrescriptionItem,
  DrugProduct,
  Substance,
  DrugInteraction,
  RefSource,
} = require("../models");
const { assertProfileRole } = require("./profile-access.service");
const moment = require("moment-timezone");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeSeverityRank = (s) => {
  const v = String(s || "").toLowerCase();
  const order = {
    contraindicated: 4,
    severe: 3,
    moderate: 2,
    mild: 1,
  };
  return order[v] || 0;
};

/**
 * Extract substances for a regimen with fallback order:
 * 1) regimen.drugProduct.substances
 * 2) regimen.prescriptionItem.drugProduct.substances
 * 3) regimen.prescriptionItem.substance
 */
const extractSubstancesForRegimen = (rr) => {
  const picked = [];
  const seenSubstanceIds = new Set();

  const pushSubstance = (s, sourcePath, brandName = null) => {
    if (!s?.id) return;
    const sid = String(s.id);
    if (seenSubstanceIds.has(sid)) return;

    seenSubstanceIds.add(sid);

    picked.push({
      id: s.id,
      name: s.name,
      atc_code: s.atc_code,
      last_reviewed_at: s.last_reviewed_at,
      source: s.source || null,
      _mapping_source: sourcePath, // internal/debug
      _drug_brand_name: brandName || null,
    });
  };

  // 1) Primary: regimen.drug_product_id -> drugProduct.substances
  const regimenProductSubs = rr?.drugProduct?.substances || [];
  for (const s of regimenProductSubs) {
    pushSubstance(s, "regimen.drug_product_id", rr?.drugProduct?.brand_name || null);
  }

  // 2) Fallback: prescription_item.drug_product_id -> prescriptionItem.drugProduct.substances
  if (picked.length === 0) {
    const itemProductSubs = rr?.prescriptionItem?.drugProduct?.substances || [];
    for (const s of itemProductSubs) {
      pushSubstance(
        s,
        "prescription_item.drug_product_id",
        rr?.prescriptionItem?.drugProduct?.brand_name || null
      );
    }
  }

  // 3) Final fallback: prescription_item.substance_id -> prescriptionItem.substance
  if (picked.length === 0 && rr?.prescriptionItem?.substance) {
    pushSubstance(
      rr.prescriptionItem.substance,
      "prescription_item.substance_id",
      rr?.prescriptionItem?.drugProduct?.brand_name ||
        rr?.drugProduct?.brand_name ||
        null
    );
  }

  return picked;
};

/**
 * Compute safety warnings for a profile.
 * - duplicates: same substance appears in >1 active regimens
 * - interactions: pairs of substances with interaction records
 */
const getMedicationWarnings = async (userId, profileId, options = {}) => {
  await assertProfileRole(userId, profileId, ["owner", "caregiver", "viewer"]);

  const includeInactive =
    String(options.include_inactive || "false").toLowerCase() === "true";

  const tz = "Asia/Ho_Chi_Minh";
  const todayYmd = moment().tz(tz).format("YYYY-MM-DD");

  const where = {
    profile_id: profileId,
  };

  if (!includeInactive) {
    where.is_active = true;

    // DATEONLY-safe filtering:
    // active today if:
    //  (start_date is null OR start_date <= today)
    //  AND (end_date is null OR end_date >= today)
    where[Op.and] = [
      {
        [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: todayYmd } }],
      },
      {
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: todayYmd } }],
      },
    ];
  }

  const regimens = await MedicationRegimen.findAll({
    where,
    attributes: [
      "id",
      "display_name",
      "drug_product_id",
      "prescription_item_id",
      "total_daily_dose",
      "dose_unit",
      "start_date",
      "end_date",
      "is_active",
    ],
    include: [
      // Path 1: regimen.drug_product_id -> drugProduct.substances
      {
        model: DrugProduct,
        as: "drugProduct",
        attributes: ["id", "brand_name", "form", "route", "strength_text"],
        required: false,
        include: [
          {
            model: Substance,
            as: "substances",
            attributes: [
              "id",
              "name",
              "atc_code",
              "source_id",
              "last_reviewed_at",
            ],
            through: { attributes: ["strength_value", "strength_unit"] },
            required: false,
            include: [
              {
                model: RefSource,
                as: "source",
                attributes: ["id", "name", "url"],
                required: false,
              },
            ],
          },
        ],
      },

      // Path 2 & 3:
      // regimen.prescription_item_id -> prescriptionItem.drugProduct.substances
      // or -> prescriptionItem.substance
      {
        model: PrescriptionItem,
        as: "prescriptionItem",
        attributes: ["id", "drug_product_id", "substance_id", "original_name_text"],
        required: false,
        include: [
          {
            model: DrugProduct,
            as: "drugProduct",
            attributes: ["id", "brand_name", "form", "route", "strength_text"],
            required: false,
            include: [
              {
                model: Substance,
                as: "substances",
                attributes: [
                  "id",
                  "name",
                  "atc_code",
                  "source_id",
                  "last_reviewed_at",
                ],
                through: { attributes: ["strength_value", "strength_unit"] },
                required: false,
                include: [
                  {
                    model: RefSource,
                    as: "source",
                    attributes: ["id", "name", "url"],
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: Substance,
            as: "substance",
            attributes: [
              "id",
              "name",
              "atc_code",
              "source_id",
              "last_reviewed_at",
            ],
            required: false,
            include: [
              {
                model: RefSource,
                as: "source",
                attributes: ["id", "name", "url"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Build substance usage map (with fallbacks)
  const substanceUse = new Map();
  const unmappedRegimens = [];

  for (const r of regimens) {
    const rr = r.get({ plain: true });

    const resolvedSubs = extractSubstancesForRegimen(rr);

    if (!resolvedSubs.length) {
      unmappedRegimens.push({
        regimen_id: rr.id,
        regimen_name: rr.display_name,
        drug_product_id: rr.drug_product_id || null,
        prescription_item_id: rr.prescription_item_id || null,
        prescription_item_name: rr?.prescriptionItem?.original_name_text || null,
        reason:
          "Không map được hoạt chất từ regimen.drug_product / prescription_item.drug_product / prescription_item.substance",
      });
      continue;
    }

    for (const s of resolvedSubs) {
      const sid = s.id;
      if (!sid) continue;

      if (!substanceUse.has(sid)) {
        substanceUse.set(sid, {
          substance: {
            id: s.id,
            name: s.name,
            atc_code: s.atc_code,
            last_reviewed_at: s.last_reviewed_at,
            source: s.source || null,
          },
          regimens: [],
        });
      }

      const bucket = substanceUse.get(sid);

      // Avoid duplicate same regimen-substance pair (defensive)
      const alreadyLinked = (bucket.regimens || []).some(
        (x) => String(x.regimen_id) === String(rr.id)
      );
      if (alreadyLinked) continue;

      bucket.regimens.push({
        regimen_id: rr.id,
        regimen_name: rr.display_name,
        drug_product_id:
          rr.drug_product_id || rr?.prescriptionItem?.drug_product_id || null,
        drug_brand_name:
          rr?.drugProduct?.brand_name ||
          rr?.prescriptionItem?.drugProduct?.brand_name ||
          null,
        mapping_source: s._mapping_source, // extra debug info (FE có thể dùng/ẩn)
      });
    }
  }

  const substancesInUse = Array.from(substanceUse.values()).map(
    (x) => x.substance
  );

  const duplicates = Array.from(substanceUse.values())
    .filter((x) => (x.regimens || []).length > 1)
    .map((x) => ({
      substance: x.substance,
      count: x.regimens.length,
      regimens: x.regimens,
    }))
    .sort((a, b) => b.count - a.count);

  const substanceIds = Array.from(substanceUse.keys());

  let interactions = [];

  if (substanceIds.length >= 2) {
    const rows = await DrugInteraction.findAll({
      where: {
        [Op.or]: [
          {
            substance_id_1: { [Op.in]: substanceIds },
            substance_id_2: { [Op.in]: substanceIds },
          },
          {
            substance_id_2: { [Op.in]: substanceIds },
            substance_id_1: { [Op.in]: substanceIds },
          },
        ],
      },
      include: [
        {
          model: Substance,
          as: "primarySubstance",
          attributes: [
            "id",
            "name",
            "atc_code",
            "source_id",
            "last_reviewed_at",
          ],
          include: [
            {
              model: RefSource,
              as: "source",
              attributes: ["id", "name", "url"],
              required: false,
            },
          ],
        },
        {
          model: Substance,
          as: "secondarySubstance",
          attributes: [
            "id",
            "name",
            "atc_code",
            "source_id",
            "last_reviewed_at",
          ],
          include: [
            {
              model: RefSource,
              as: "source",
              attributes: ["id", "name", "url"],
              required: false,
            },
          ],
        },
        {
          model: RefSource,
          as: "source",
          attributes: ["id", "name", "url"],
          required: false,
        },
      ],
    });

    // Deduplicate symmetric results (A-B == B-A)
    const seen = new Set();

    interactions = rows
      .map((row) => row.get({ plain: true }))
      .map((it) => {
        const a = it.primarySubstance;
        const b = it.secondarySubstance;
        const key = [a?.id, b?.id].sort().join("-");
        return { key, ...it };
      })
      .filter((it) => {
        if (!it.key) return false;
        if (seen.has(it.key)) return false;
        seen.add(it.key);
        return true;
      })
      .map((it) => ({
        id: it.id,
        severity: it.severity,
        description: it.description,
        management: it.management,
        substance_1: it.primarySubstance,
        substance_2: it.secondarySubstance,
        source: it.source || null,
        created_at: it.created_at,
        updated_at: it.updated_at,
      }))
      .sort(
        (a, b) =>
          normalizeSeverityRank(b.severity) - normalizeSeverityRank(a.severity)
      );
  }

  return {
    profile_id: profileId,
    as_of: new Date().toISOString(),
    regimens_count: regimens.length,
    substances_in_use: substancesInUse,
    duplicates,
    interactions,
    unmapped_regimens: unmappedRegimens, // additive field for QA/FE debug
  };
};

module.exports = {
  getMedicationWarnings,
};