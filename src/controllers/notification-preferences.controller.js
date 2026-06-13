const notificationPreferencesService = require("../services/notification-preferences.service");

const listPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.query.profile_id;

    const result = await notificationPreferencesService.listPreferences(
      userId,
      profileId,
    );

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const upsertPreference = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await notificationPreferencesService.upsertPreference(
      userId,
      req.body || {},
    );

    return res.status(200).json({ notification_preference: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listPreferences,
  upsertPreference,
};
