const nodemailer = require("nodemailer");
const config = require("./env");

/**
 * Create and configure Nodemailer transporter
 * Using Gmail SMTP for MVP
 */
const createTransporter = () => {
  if (!config.email.user || !config.email.password) {
    console.warn(
      "⚠️  Email credentials not configured. Email sending will be disabled."
    );
    return null;
  }

  return nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

const transporter = createTransporter();

module.exports = transporter;
