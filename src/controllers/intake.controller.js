const intakeService = require("../services/intake.service");

const listIntakeEventsInRange = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const events = await intakeService.listIntakeEventsInRange(
      req.user.id,
      profileId,
      req.query
    );
    return res.json(events);
  } catch (error) {
    return next(error);
  }
};

const updateIntakeEventCheckin = async (req, res, next) => {
  try {
    const { intakeEventId } = req.params;
    const updated = await intakeService.updateIntakeEventCheckin(
      req.user.id,
      intakeEventId,
      req.body
    );
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listIntakeEventsInRange,
  updateIntakeEventCheckin,
};
