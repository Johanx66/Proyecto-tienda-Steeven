require('dotenv').config();

async function main() {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, WEBHOOK_BASE_URL } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !WEBHOOK_BASE_URL) {
    throw new Error('Configura TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET y WEBHOOK_BASE_URL.');
  }

  const baseUrl = WEBHOOK_BASE_URL.replace(/\/+$/, '');
  if (!baseUrl.startsWith('https://')) {
    throw new Error('WEBHOOK_BASE_URL debe ser una URL HTTPS pública para Telegram.');
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${baseUrl}/api/notificaciones/telegram/webhook`,
      secret_token: TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ['message'],
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Telegram rechazó la configuración del webhook.');
  }
  console.log(`Webhook de Telegram configurado en ${baseUrl}/api/notificaciones/telegram/webhook`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
