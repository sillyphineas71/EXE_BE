const MedicationRegimensService = require("../services/medication-regimens.service");
const schedulerService = require("../services/scheduler.service");

const createRegimes = async (req, res, next) => {
  try {
    const data = req.body;
    const profileId = req.params.profileId;
    const userId = req.user.id;
    const result = await MedicationRegimensService.createRegimes(
      userId,
      profileId,
      data
    );
    await schedulerService.scheduleRemindersForRegimen(result);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getRegimensByProfile = async (req, res, next) => {
  try {
    const is_active = req.query.is_active;

    const profileId = req.params.profileId;
    const userId = req.user.id;

    const result = await MedicationRegimensService.getRegimensByProfile(
      userId,
      profileId,
      is_active
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getRegimenDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const regimenId = req.params.regimenId;

    const result = await MedicationRegimensService.getRegimenDetail(
      userId,
      regimenId
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const updateRegimen = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const regimenId = req.params.regimenId;
    const data = req.body;
    const result = await MedicationRegimensService.updateRegimen(
      userId,
      regimenId,
      data
    );
    if (result && result.is_active) {
      await schedulerService.scheduleRemindersForRegimen(result);
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const stopRegimen = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const regimenId = req.params.regimenId;
    const result = await MedicationRegimensService.stopRegimen(
      userId,
      regimenId
    );
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  createRegimes,
  getRegimensByProfile,
  getRegimenDetail,
  updateRegimen,
  stopRegimen,
};
