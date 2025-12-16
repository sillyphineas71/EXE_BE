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

module.exports = {
  createPatientProfile,
};
