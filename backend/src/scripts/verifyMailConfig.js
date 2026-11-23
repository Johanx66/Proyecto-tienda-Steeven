require('dotenv').config();

const { transporter, mockMode, missingSettings, smtpConfigured } = require('../config/mailer');

async function main() {
  if (mockMode) {
    throw new Error('MAIL_MOCK=true: el envío está simulado y no salen correos.');
  }
  if (!smtpConfigured || !transporter) {
    throw new Error(`Configuración incompleta. Define: ${missingSettings.join(', ')}.`);
  }

  await transporter.verify();
  console.log('La conexión SMTP y sus credenciales fueron verificadas.');
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
