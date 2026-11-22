const crypto = require('node:crypto');
const Notification = require('../models/Notification');
const { vapidConfigured, sendTelegramLinkMessage } = require('../services/notificationService');

function getConfiguration() {
  return {
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || null,
    telegramAvailable: Boolean(
      process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_BOT_USERNAME &&
      process.env.TELEGRAM_WEBHOOK_SECRET
    ),
    pushAvailable: vapidConfigured,
    vapidPublicKey: vapidConfigured ? process.env.VAPID_PUBLIC_KEY : null,
  };
}

async function getMine(req, res, next) {
  try {
    const [preferences, notifications] = await Promise.all([
      Notification.getPreferences(req.user.id),
      Notification.list(req.user.id),
    ]);
    res.json({ preferences, notifications, integrations: getConfiguration() });
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { telegramEnabled, pushEnabled } = req.body;
    if (
      (telegramEnabled !== undefined && typeof telegramEnabled !== 'boolean') ||
      (pushEnabled !== undefined && typeof pushEnabled !== 'boolean')
    ) {
      return res.status(400).json({ error: 'Las preferencias deben ser valores booleanos.' });
    }
    if (
      telegramEnabled &&
      (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET)
    ) {
      return res.status(503).json({ error: 'Telegram no está configurado en el servidor.' });
    }
    if (telegramEnabled) {
      const preferences = await Notification.getPreferences(req.user.id);
      if (!preferences.telegram_vinculado) {
        return res.status(409).json({ error: 'Primero vincula tu cuenta de Telegram.' });
      }
    }
    if (pushEnabled) {
      if (!vapidConfigured) {
        return res.status(503).json({ error: 'Las notificaciones push no están configuradas.' });
      }
      const subscriptions = await Notification.getPushSubscriptions(req.user.id);
      if (subscriptions.length === 0) {
        return res
          .status(409)
          .json({ error: 'Activa primero las notificaciones en este dispositivo.' });
      }
    }
    await Notification.updatePreferences(req.user.id, {
      telegramEnabled,
      pushEnabled,
    });
    if (pushEnabled === false) await Notification.removePushSubscriptions(req.user.id);
    res.json({ preferences: await Notification.getPreferences(req.user.id) });
  } catch (err) {
    next(err);
  }
}

async function createTelegramLink(req, res, next) {
  try {
    const { telegramBotUsername } = getConfiguration();
    if (
      !telegramBotUsername ||
      !process.env.TELEGRAM_BOT_TOKEN ||
      !process.env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return res.status(503).json({ error: 'Telegram no está configurado en el servidor.' });
    }
    const token = crypto.randomBytes(24).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await Notification.createTelegramLink(
      req.user.id,
      tokenHash,
      new Date(Date.now() + 10 * 60_000)
    );
    res.json({ url: `https://t.me/${telegramBotUsername}?start=${token}`, expiresInMinutes: 10 });
  } catch (err) {
    next(err);
  }
}

async function unlinkTelegram(req, res, next) {
  try {
    await Notification.unlinkTelegram(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

function validPushSubscription(subscription) {
  if (
    !subscription ||
    typeof subscription.endpoint !== 'string' ||
    !subscription.keys ||
    typeof subscription.keys.p256dh !== 'string' ||
    typeof subscription.keys.auth !== 'string'
  ) {
    return false;
  }
  try {
    const endpoint = new URL(subscription.endpoint);
    const host = endpoint.hostname.toLowerCase();
    const approvedHost =
      host === 'fcm.googleapis.com' ||
      host === 'web.push.apple.com' ||
      host === 'push.services.mozilla.com' ||
      host.endsWith('.push.services.mozilla.com') ||
      host.endsWith('.notify.windows.com');
    return endpoint.protocol === 'https:' && approvedHost;
  } catch {
    return false;
  }
}

async function savePushSubscription(req, res, next) {
  try {
    if (!vapidConfigured) {
      return res.status(503).json({ error: 'Las notificaciones push no están configuradas.' });
    }
    if (!validPushSubscription(req.body)) {
      return res.status(400).json({ error: 'La suscripción push no es válida.' });
    }
    await Notification.savePushSubscription(req.user.id, req.body);
    res.status(201).json({ ok: true, preferences: await Notification.getPreferences(req.user.id) });
  } catch (err) {
    next(err);
  }
}

async function disablePush(req, res, next) {
  try {
    await Notification.removePushSubscriptions(req.user.id);
    res.json({ ok: true, preferences: await Notification.getPreferences(req.user.id) });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Identificador de notificación inválido.' });
    }
    const notification = await Notification.markRead(req.user.id, req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notificación no encontrada.' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

async function telegramWebhook(req, res) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.get('x-telegram-bot-api-secret-token');
  if (!configuredSecret || receivedSecret !== configuredSecret) {
    return res.sendStatus(401);
  }
  const message = req.body?.message;
  const chat = message?.chat;
  const match =
    typeof message?.text === 'string' &&
    message.text.match(/^\/start\s+([A-Za-z0-9_-]{20,64})\s*$/);
  if (!chat || chat.type !== 'private' || !match) return res.sendStatus(200);

  try {
    const tokenHash = crypto.createHash('sha256').update(match[1]).digest('hex');
    const userId = await Notification.consumeTelegramLink(tokenHash, String(chat.id));
    const response = userId
      ? 'Tu cuenta de Telegram quedó vinculada con la tienda. Activa los avisos desde tu perfil.'
      : 'El enlace no es válido o ya venció. Genera uno nuevo desde tu perfil de la tienda.';
    await sendTelegramLinkMessage(String(chat.id), response);
    return res.sendStatus(200);
  } catch (err) {
    console.error('Error procesando el webhook de Telegram:', err.message);
    return res.sendStatus(500);
  }
}

module.exports = {
  getMine,
  updatePreferences,
  createTelegramLink,
  unlinkTelegram,
  savePushSubscription,
  disablePush,
  markRead,
  telegramWebhook,
};
