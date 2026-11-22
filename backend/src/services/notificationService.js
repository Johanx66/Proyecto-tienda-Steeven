const webpush = require('web-push');
const Notification = require('../models/Notification');

const vapidConfigured = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT
);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no está configurado');
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Telegram no pudo entregar el mensaje');
  }
}

async function notifyOrderConfirmed(order, user) {
  const notification = await Notification.create({
    userId: user.id,
    type: 'PEDIDO_CONFIRMADO',
    title: `Pedido #${order.id} confirmado`,
    message: `Tu pedido #${order.id} fue confirmado y será despachado.`,
    data: { orderId: order.id, url: '/mis-pedidos' },
  });
  const preferences = await Notification.getPreferences(user.id);
  const tasks = [];

  if (preferences.telegram_habilitado && preferences.telegram_vinculado) {
    tasks.push(
      (async () => {
        const chatId = await Notification.getTelegramChatId(user.id);
        if (chatId) {
          await sendTelegramMessage(chatId, notification.message);
        }
      })()
    );
  }

  if (preferences.push_habilitado && vapidConfigured) {
    const subscriptions = await Notification.getPushSubscriptions(user.id);
    for (const row of subscriptions) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.clave_p256dh, auth: row.clave_auth },
      };
      tasks.push(
        webpush
          .sendNotification(
            subscription,
            JSON.stringify({
              title: notification.titulo,
              body: notification.message,
              url: '/mis-pedidos',
            })
          )
          .catch(async (err) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await Notification.removePushEndpoint(row.endpoint);
              return;
            }
            throw err;
          })
      );
    }
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('No se pudo entregar una notificación externa:', result.reason.message);
    }
  });
}

async function sendTelegramLinkMessage(chatId, message) {
  try {
    await sendTelegramMessage(chatId, message);
  } catch (err) {
    console.error('Telegram no pudo responder al usuario:', err.message);
  }
}

module.exports = { notifyOrderConfirmed, sendTelegramLinkMessage, vapidConfigured };
