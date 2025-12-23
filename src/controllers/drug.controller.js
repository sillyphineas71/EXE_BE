const drugService = require("../services/drug.service");

const searchDrugProducts = async (req, res, next) => {
  try {
    const { q, substance_id, limit, offset } = req.query;
    const results = await drugService.searchDrugProducts({
      q,
      substance_id,
      limit,
      offset,
    });
    return res.json(results);
  } catch (error) {
    return next(error);
  }
};

const getDrugProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await drugService.getDrugProductById(productId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const searchSubstances = async (req, res, next) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await drugService.searchSubstances({ q, limit, offset });
    return res.json(results);
  } catch (error) {
    return next(error);
  }
};

const getSubstanceById = async (req, res, next) => {
  try {
    const { substanceId } = req.params;
    const result = await drugService.getSubstanceById(substanceId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  searchDrugProducts,
  getDrugProductById,
  searchSubstances,
  getSubstanceById,
};
