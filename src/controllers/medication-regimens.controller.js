// // src/controllers/medication-regimens.controller.js
// const MedicationRegimensService = require("../services/medication-regimens.service");
// const schedulerService = require("../services/scheduler.service");

// const createRegimes = async (req, res, next) => {
//   try {
//     const data = req.body;
//     const profileId = req.params.profileId;
//     const userId = req.user.id;

//     const result = await MedicationRegimensService.createRegimes(userId, profileId, data);

//     // tạo mới thì schedule luôn (resetExisting vẫn ok, nhưng không cần thiết)
//     await schedulerService.scheduleRemindersForRegimen(result, { resetExisting: false });

//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// const getRegimensByProfile = async (req, res, next) => {
//   try {
//     const is_active = req.query.is_active;
//     const profileId = req.params.profileId;
//     const userId = req.user.id;

//     const result = await MedicationRegimensService.getRegimensByProfile(userId, profileId, is_active);
//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// const getRegimenDetail = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const regimenId = req.params.regimenId;

//     const result = await MedicationRegimensService.getRegimenDetail(userId, regimenId);
//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// const updateRegimen = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const regimenId = req.params.regimenId;
//     const data = req.body;

//     const result = await MedicationRegimensService.updateRegimen(userId, regimenId, data);

//     // ✅ update: cancel lịch cũ rồi schedule lại nếu active
//     await schedulerService.cancelRemindersForRegimen(regimenId);

//     if (result && result.is_active) {
//       await schedulerService.scheduleRemindersForRegimen(result, { resetExisting: false });
//     }

//     return res.json(result);
//   } catch (error) {
//     return next(error);
//   }
// };

// const stopRegimen = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const regimenId = req.params.regimenId;

//     await MedicationRegimensService.stopRegimen(userId, regimenId);

//     // ✅ stop: hủy job luôn
//     await schedulerService.cancelRemindersForRegimen(regimenId);

//     return res.status(204).send();
//   } catch (error) {
//     return next(error);
//   }
// };

// module.exports = {
//   createRegimes,
//   getRegimensByProfile,
//   getRegimenDetail,
//   updateRegimen,
//   stopRegimen,
// };

const MedicationRegimensService = require("../services/medication-regimens.service");
const schedulerService = require("../services/scheduler.service");
const { MedicationRegimen } = require("../models");

const createRegimes = async (req, res, next) => {
  try {
    const data = req.body;
    const profileId = req.params.profileId;
    const userId = req.user.id;

    const result = await MedicationRegimensService.createRegimes(
      userId,
      profileId,
      data,
    );

    // schedule reminders for today
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
      is_active,
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
      regimenId,
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

    // capture old schedule for cancel
    const before = await MedicationRegimen.findByPk(regimenId, {
      attributes: ["id", "schedule_payload", "timezone"],
    });

    const oldTimes = before?.schedule_payload?.times || [];
    const oldTz = before?.timezone || "Asia/Ho_Chi_Minh";

    const result = await MedicationRegimensService.updateRegimen(
      userId,
      regimenId,
      data,
    );

    // cancel old delayed jobs for today
    await schedulerService.cancelRemindersForRegimenTimes({
      regimenId,
      times: oldTimes,
      timezone: oldTz,
    });

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

    // capture old times to cancel reminders
    const before = await MedicationRegimen.findByPk(regimenId, {
      attributes: ["id", "schedule_payload", "timezone"],
    });

    const oldTimes = before?.schedule_payload?.times || [];
    const oldTz = before?.timezone || "Asia/Ho_Chi_Minh";

    await MedicationRegimensService.stopRegimen(userId, regimenId);

    await schedulerService.cancelRemindersForRegimenTimes({
      regimenId,
      times: oldTimes,
      timezone: oldTz,
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
const getRegimensByProfileInUse = async (req, res, next) => {
  try {
    const profileId = req.params.profileId;
    const userId = req.user.id;

    const result = await MedicationRegimensService.getRegimensByProfileInUse(
      userId,
      profileId,
    );

    return res.json(result);
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
  getRegimensByProfileInUse,
};
