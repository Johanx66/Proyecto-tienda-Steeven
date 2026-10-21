const nodemailer = require('nodemailer');
require('dotenv').config();

const mockMode = process.env.MAIL_MOCK === 'true';

let transporter = null;
if (!mockMode) {
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

const mailFrom = process.env.MAIL_FROM || 'Frutería Web <no-reply@fruteria.local>';

module.exports = { transporter, mailFrom, mockMode };
