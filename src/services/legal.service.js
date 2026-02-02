const {
  LegalDocument,
  UserLegalAcceptance,
  RefSource,
} = require("../models/index");
const { Op } = require("sequelize");

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
const createRefSources = async (data) => {
  const { name, url, description, license_info } = data;
  const newRefSrc = await RefSource.create({
    name,
    url,
    description,
    license_info,
    created_at: new Date(),
  });
  return newRefSrc;
};

const getLegalDocuments = async ({ doc_type, latest = true }) => {
  const where = {};

  where.effective_at = { [Op.lte]: new Date() };

  if (doc_type) {
    where.doc_type = doc_type;
  }

  if (latest) {
    if (doc_type) {
      const doc = await LegalDocument.findOne({
        where,
        order: [["effective_at", "DESC"]],
      });
      return doc;
    }
    const types = ["terms_of_use", "privacy_policy", "disclaimer"];
    const results = [];

    for (const type of types) {
      const doc = await LegalDocument.findOne({
        where: { ...where, doc_type: type },
        order: [["effective_at", "DESC"]],
      });
      if (doc) results.push(doc);
    }
    return results;
  }

  return await LegalDocument.findAll({
    where,
    order: [["effective_at", "DESC"]],
  });
};

const acceptLegalDocument = async (userId, legal_document_id) => {
  const doc = await LegalDocument.findByPk(legal_document_id);
  if (!doc) throw httpError("Văn bản pháp lý không tồn tại", 404);

  const existing = await UserLegalAcceptance.findOne({
    where: { user_id: userId, legal_document_id },
  });

  if (existing) return existing;

  const acceptance = await UserLegalAcceptance.create({
    user_id: userId,
    legal_document_id,
    accepted_at: new Date(),
  });

  return acceptance;
};

const getUserAcceptances = async (userId) => {
  return await UserLegalAcceptance.findAll({
    where: { user_id: userId },
    include: [
      {
        model: LegalDocument,
        as: "legalDocument",
        attributes: ["id", "doc_type", "version", "title", "effective_at"],
      },
    ],
    order: [["accepted_at", "DESC"]],
  });
};

module.exports = {
  getLegalDocuments,
  acceptLegalDocument,
  getUserAcceptances,
  createRefSources,
};
