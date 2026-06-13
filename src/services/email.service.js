const transporter = require("../config/email");
const config = require("../config/env");

/**
 * Send email notification when a profile is shared with a user
 * @param {Object} data - Email data
 * @param {string} data.recipientEmail - Email address of the person receiving the share
 * @param {string} data.recipientName - Full name of the recipient
 * @param {string} data.sharerName - Full name of the person sharing
 * @param {string} data.profileName - Name of the patient profile being shared
 * @param {string} data.role - Role assigned (owner/caregiver/viewer)
 */
const sendProfileShareNotification = async (data) => {
  const { recipientEmail, recipientName, sharerName, profileName, role } =
    data;

  if (!transporter) {
    console.warn("⚠️  Email transporter not configured. Skipping email send.");
    return { success: false, error: "Email not configured" };
  }

  // Role descriptions in Vietnamese
  const roleDescriptions = {
    owner: "Chủ sở hữu - Có toàn quyền quản lý hồ sơ",
    caregiver: "Người chăm sóc - Có thể xem và cập nhật thông tin",
    viewer: "Người xem - Chỉ có thể xem thông tin",
  };

  const roleDescription = roleDescriptions[role] || role;

  // Email subject
  const subject = `[CareDose] Bạn được chia sẻ hồ sơ bệnh nhân`;

  // HTML email template
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2e8ecfff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
    .info-box { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #2e8ecfff; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .role-badge { display: inline-block; background-color: #2e8ecfff; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 CareDose</h1>
    </div>
    <div class="content">
      <h2>Xin chào ${recipientName},</h2>
      <p><strong>${sharerName}</strong> đã chia sẻ hồ sơ bệnh nhân với bạn.</p>
      
      <div class="info-box">
        <p><strong>📋 Hồ sơ bệnh nhân:</strong> ${profileName}</p>
        <p><strong>👤 Vai trò của bạn:</strong> <span class="role-badge">${role.toUpperCase()}</span></p>
        <p style="margin-top: 10px; font-size: 14px; color: #666;">${roleDescription}</p>
      </div>

      <p>Vui lòng đăng nhập vào ứng dụng <strong>CareDose</strong> để xem chi tiết và quản lý hồ sơ.</p>
      
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ CareDose</strong></p>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động từ hệ thống CareDose. Vui lòng không trả lời email này.</p>
    </div>
  </div>
</body>
</html>
  `;

  // Plain text fallback
  const textContent = `
Xin chào ${recipientName},

${sharerName} đã chia sẻ hồ sơ bệnh nhân với bạn.

Hồ sơ bệnh nhân: ${profileName}
Vai trò của bạn: ${role.toUpperCase()}
${roleDescription}

Vui lòng đăng nhập vào ứng dụng CareDose để xem chi tiết và quản lý hồ sơ.

Trân trọng,
Đội ngũ CareDose

---
Email này được gửi tự động từ hệ thống CareDose. Vui lòng không trả lời email này.
  `;

  const mailOptions = {
    from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
    to: recipientEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendProfileShareNotification,
};
