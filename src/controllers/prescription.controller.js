// const prescriptionService = require("../services/prescription.service");

// const createPrescription = async (req, res, next) => {
//   try {
//     const { profileId } = req.params;
//     const prescription = await prescriptionService.createPrescription(
//       req.user.id,
//       profileId,
//       req.body
//     );
//     return res.status(201).json(prescription);
//   } catch (error) {
//     return next(error);
//   }
// };

// const addPrescriptionItem = async (req, res, next) => {
//   try {
//     const { prescriptionId } = req.params;
//     const item = await prescriptionService.addPrescriptionItem(
//       req.user.id,
//       prescriptionId,
//       req.body
//     );
//     return res.status(201).json(item);
//   } catch (error) {
//     return next(error);
//   }
// };

// const getPrescriptionById = async (req, res, next) => {
//   try {
//     const { prescriptionId } = req.params;
//     const result = await prescriptionService.getPrescriptionById(
//       req.user.id,
//       prescriptionId
//     );
//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// const updatePrescriptionItem = async (req, res, next) => {
//   try {
//     const { prescriptionId, itemId } = req.params;
//     const item = await prescriptionService.updatePrescriptionItem(
//       req.user.id,
//       prescriptionId,
//       itemId,
//       req.body
//     );
//     return res.json(item);
//   } catch (error) {
//     return next(error);
//   }
// };

// const deletePrescriptionItem = async (req, res, next) => {
//   try {
//     const { prescriptionId, itemId } = req.params;
//     await prescriptionService.deletePrescriptionItem(
//       req.user.id,
//       prescriptionId,
//       itemId
//     );
//     return res.status(204).send();
//   } catch (error) {
//     return next(error);
//   }
// };

// const updatePrescription = async (req, res, next) => {
//   try {
//     const { prescriptionId } = req.params;
//     const prescription = await prescriptionService.updatePrescription(
//       req.user.id,
//       prescriptionId,
//       req.body
//     );
//     return res.json(prescription);
//   } catch (error) {
//     return next(error);
//   }
// };

// const listPrescriptionsByProfile = async (req, res, next) => {
//   try {
//     const { profileId } = req.params;
//     const { status, limit = 10, offset = 0 } = req.query;
//     const result = await prescriptionService.listPrescriptionsByProfile(
//       req.user.id,
//       profileId,
//       status,
//       limit,
//       offset,
//     );
//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// module.exports = {
//   createPrescription,
//   addPrescriptionItem,
//   getPrescriptionById,
//   updatePrescriptionItem,
//   deletePrescriptionItem,
//   updatePrescription,
//   listPrescriptionsByProfile,
// };

const prescriptionService = require("../services/prescription.service");

const createPrescription = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const prescription = await prescriptionService.createPrescription(
      req.user.id,
      profileId,
      req.body,
    );
    return res.status(201).json(prescription);
  } catch (error) {
    return next(error);
  }
};

const addPrescriptionItem = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const item = await prescriptionService.addPrescriptionItem(
      req.user.id,
      prescriptionId,
      req.body,
    );
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const result = await prescriptionService.getPrescriptionById(
      req.user.id,
      prescriptionId,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updatePrescriptionItem = async (req, res, next) => {
  try {
    const { prescriptionId, itemId } = req.params;
    const item = await prescriptionService.updatePrescriptionItem(
      req.user.id,
      prescriptionId,
      itemId,
      req.body,
    );
    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

const updatePrescriptionItemById = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await prescriptionService.updatePrescriptionItemById(
      req.user.id,
      itemId,
      req.body,
    );
    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

const deletePrescriptionItem = async (req, res, next) => {
  try {
    const { prescriptionId, itemId } = req.params;
    await prescriptionService.deletePrescriptionItem(
      req.user.id,
      prescriptionId,
      itemId,
    );
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const deletePrescriptionItemById = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    await prescriptionService.deletePrescriptionItemById(req.user.id, itemId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const deletePrescriptionFileById = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await prescriptionService.deletePrescriptionFileById(req.user.id, fileId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const updatePrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await prescriptionService.updatePrescription(
      req.user.id,
      prescriptionId,
      req.body,
    );
    return res.json(prescription);
  } catch (error) {
    return next(error);
  }
};

const listPrescriptionsByProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;
    const result = await prescriptionService.listPrescriptionsByProfile(
      req.user.id,
      profileId,
      status,
      limit,
      offset,
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPrescription,
  addPrescriptionItem,
  getPrescriptionById,
  updatePrescriptionItem,
  updatePrescriptionItemById,
  deletePrescriptionItem,
  deletePrescriptionItemById,
  deletePrescriptionFileById,
  updatePrescription,
  listPrescriptionsByProfile,
};
