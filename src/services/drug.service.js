const {
  DrugProduct,
  Substance,
  ProductSubstance,
  RefSource,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const searchDrugProducts = async ({
  q,
  substance_id,
  limit = 20,
  offset = 0,
}) => {
  const where = {};

  if (q && q.trim()) {
    where.brand_name = {
      [Op.iLike]: `%${q.trim()}%`,
    };
  }

  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const parsedOffset = parseInt(offset) || 0;

  const includeOptions = [
    {
      model: Substance,
      as: "substances",
      through: { attributes: ["strength_value", "strength_unit"] },
      attributes: ["id", "name", "atc_code"],
    },
  ];

  if (substance_id && substance_id.trim()) {
    includeOptions[0].where = { id: substance_id.trim() };
    includeOptions[0].required = true;
  }

  const products = await DrugProduct.findAll({
    where,
    include: includeOptions,
    limit: parsedLimit,
    offset: parsedOffset,
    order: [["brand_name", "ASC"]],
  });

  return products.map((p) => {
    const plain = p.get({ plain: true });
    return {
      drug_product: {
        id: plain.id,
        brand_name: plain.brand_name,
        form: plain.form,
        route: plain.route,
        strength_text: plain.strength_text,
        manufacturer: plain.manufacturer,
        country: plain.country,
        is_generic: plain.is_generic,
      },
      substances: (plain.substances || []).map((s) => ({
        id: s.id,
        name: s.name,
        atc_code: s.atc_code,
        strength_value: s.ProductSubstance?.strength_value || null,
        strength_unit: s.ProductSubstance?.strength_unit || null,
      })),
    };
  });
};

const getDrugProductById = async (productId) => {
  const product = await DrugProduct.findByPk(productId, {
    include: [
      {
        model: Substance,
        as: "substances",
        through: { attributes: ["strength_value", "strength_unit"] },
        attributes: ["id", "name", "atc_code"],
      },
    ],
  });

  if (!product) {
    throw httpError("Không tìm thấy thuốc", 404);
  }

  const plain = product.get({ plain: true });
  return {
    drug_product: {
      id: plain.id,
      brand_name: plain.brand_name,
      form: plain.form,
      route: plain.route,
      strength_text: plain.strength_text,
      manufacturer: plain.manufacturer,
      country: plain.country,
      is_generic: plain.is_generic,
    },
    substances: (plain.substances || []).map((s) => ({
      id: s.id,
      name: s.name,
      atc_code: s.atc_code,
      strength_value: s.ProductSubstance?.strength_value || null,
      strength_unit: s.ProductSubstance?.strength_unit || null,
    })),
  };
};

const searchSubstances = async ({ q, limit = 20, offset = 0 }) => {
  const where = {};

  if (q && q.trim()) {
    where.name = sequelize.where(sequelize.fn("LOWER", sequelize.col("name")), {
      [Op.like]: `%${q.trim().toLowerCase()}%`,
    });
  }

  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const parsedOffset = parseInt(offset) || 0;

  const substances = await Substance.findAll({
    where,
    attributes: ["id", "name", "atc_code", "title"],
    limit: parsedLimit,
    offset: parsedOffset,
    order: [["name", "ASC"]],
  });

  return substances.map((s) => {
    const plain = s.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      atc_code: plain.atc_code,
      title: plain.title,
    };
  });
};

const getSubstanceById = async (substanceId) => {
  const substance = await Substance.findByPk(substanceId, {
    include: [
      {
        model: RefSource,
        as: "source",
        attributes: ["id", "name", "url", "description", "license_info"],
      },
    ],
  });

  if (!substance) {
    throw httpError("Không tìm thấy hoạt chất", 404);
  }

  const plain = substance.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    atc_code: plain.atc_code,
    title: plain.title,
    summary: plain.summary,
    indications: plain.indications,
    warnings: plain.warnings,
    side_effects: plain.side_effects,
    usual_dose_text: plain.usual_dose_text,
    source: plain.source || null,
    last_reviewed_at: plain.last_reviewed_at,
  };
};

module.exports = {
  searchDrugProducts,
  getDrugProductById,
  searchSubstances,
  getSubstanceById,
};
