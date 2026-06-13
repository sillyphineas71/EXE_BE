const profileExportService = require("../services/profile-export.service");

const exportPatientProfilePdf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileId = req.params.profileId;

    // Cho phép lấy từ body hoặc query (đỡ phụ thuộc FE)
    const mode = req.body?.mode || req.query?.mode || "summary"; // summary | full
    const rangeDays = Number(req.body?.rangeDays || req.query?.rangeDays || 30); // 7|30|90

    const result = await profileExportService.exportPatientProfilePdf(
      userId,
      profileId,
      { mode, rangeDays },
    );

    // result: { filename, mime, base64 }
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { exportPatientProfilePdf };
