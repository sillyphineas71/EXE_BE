const medicationSafetyService = require("../services/medication-safety.service");

const getMedicationWarnings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { profileId } = req.params;

    const include_inactive = req.query.include_inactive;

    const result = await medicationSafetyService.getMedicationWarnings(
      userId,
      profileId,
      { include_inactive },
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMedicationWarnings,
};
