const legalService = require("../services/legal.service");

const getDocuments = async (req, res, next) => {
  try {
    const { doc_type, latest } = req.query;
    const isLatest = latest === "true" || latest === undefined;

    const result = await legalService.getLegalDocuments({
      doc_type,
      latest: isLatest,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const acceptDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { legal_document_id } = req.body;
    const result = await legalService.acceptLegalDocument(
      userId,
      legal_document_id
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await legalService.getUserAcceptances(userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  acceptDocument,
  getHistory,
};
