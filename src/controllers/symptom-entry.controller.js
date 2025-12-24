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
module.exports = { createSymptomEntry };
