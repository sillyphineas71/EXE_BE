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
  } catch (e) {
    return next(e);
  }
};
const listTodayIntakeEvents = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const events = await intakeService.listTodayIntakeEvents(
      req.user.id,
      profileId,
      req.query
    );
    return res.json(events);
  } catch (e) {
    return next(e);
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
  } catch (e) {
    return next(e);
  }
};

const listIntakeEventsForSummary = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const events = await intakeService.listIntakeEventsForSummary(
      req.user.id,
      profileId,
      req.query
    );
    return res.json(events);
  } catch (e) {
    return next(e);
  }
};

module.exports = {
  listIntakeEventsInRange,
  listTodayIntakeEvents,
  updateIntakeEventCheckin,
  listIntakeEventsForSummary,
};
