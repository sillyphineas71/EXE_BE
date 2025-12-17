const PatientProfileController = require("../services/patient-profiles.service");

const createPatientProfile = async (req, res, next) => {
  try {
    const { full_name, date_of_birth, sex, relationship_to_owner, notes } =
      req.body;
    const owner_user_id = req.user.id;
    const result = await PatientProfileController.createPatientProfile(
      owner_user_id,
      {
        full_name,
        date_of_birth,
        sex,
        relationship_to_owner,
        notes,
      }
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getAccessibleProfiles = async (req, res, next) => {
  try {
    const owner_user_id = req.user.id;
    const result = await PatientProfileController.getAccessibleProfiles(
      owner_user_id
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getProfileDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const result = await PatientProfileController.getProfileDetail(
      profileId,
      userId
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  createPatientProfile,
  getAccessibleProfiles,
  getProfileDetail,
};
