const prescriptionService = require("../services/prescription.service");

const createPrescription = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const prescription = await prescriptionService.createPrescription(
      req.user.id,
      profileId,
      req.body
    );
    return res.status(201).json(prescription);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPrescription,
};
