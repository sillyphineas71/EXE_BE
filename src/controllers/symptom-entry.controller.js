const SymptomEntryService = require("../services/symptom-entry.service");

const createSymptomEntry = async (req, res, next) => {
  try {
    const data = req.body;
    const profileId = req.params.profileId;
    const userId = req.user.id;
    const result = await SymptomEntryService.createSymptomEntry(
      userId,
      profileId,
      data
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getSymptomsByProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;
    const { from, to, limit, offset } = req.query;

    const result = await SymptomEntryService.getSymptomsByProfile(
      userId,
      profileId,
      { from, to, limit, offset }
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getSymptomDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const symptomId = req.params.symptomId;

    const result = await SymptomEntryService.getSymptomDetail(
      userId,
      symptomId
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  createSymptomEntry,
  getSymptomsByProfile,
  getSymptomDetail,
};
