const ProfileShareService = require("../services/profile-share.service");

const createProfileShare = async (req, res, next) => {
  try {
    const data = req.body;
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const result = await ProfileShareService.createProfileShare(
      userId,
      profileId,
      data
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const getUserOfProfileShare = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const result = await ProfileShareService.getUserOfProfileShare(
      userId,
      profileId
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const updateProfileShare = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const shareId = req.params.shareId;
    const data = req.body;
    const result = await ProfileShareService.updateProfileShare(
      userId,
      profileId,
      shareId,
      data
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
const deleteProfileShare = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;
    const shareId = req.params.shareId;
    const result = await ProfileShareService.deleteProfileShare(
      userId,
      profileId,
      shareId
    );
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  createProfileShare,
  getUserOfProfileShare,
  updateProfileShare,
  deleteProfileShare,
};
