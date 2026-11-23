const nodemailer = require('nodemailer');
require('dotenv').config();

const mockMode = process.env.MAIL_MOCK === 'true';
const mailFrom = process.env.MAIL_FROM || 'Frutería Web <no-reply@fruteria.local>';
const missingSettings = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'].filter(
  (name) => !process.env[name]
);
const smtpConfigured = missingSettings.length === 0;

let transporter = null;
if (!mockMode && smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

module.exports = { transporter, mailFrom, mockMode, smtpConfigured, missingSettings };
