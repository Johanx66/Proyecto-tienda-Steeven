const OrderVerification = require('../models/OrderVerification');
const emailService = require('./emailService');
const { VERIFICATION_STATES } = require('../utils/constants');

async function createOrderVerification(client, orderId) {
  const ttlMinutes = Number(process.env.VERIFICATION_TOKEN_TTL_MINUTES) || 30;
  return OrderVerification.create({ pedido_id: orderId, ttlMinutes, client });
}

async function processOrderWithEmail(order, user, verification) {
  try {
    await emailService.sendOrderConfirmation(order, user, verification.token);
    console.log(`Pedido ${order.id}: correo de confirmación enviado a ${user.email}`);
  } catch (err) {
    console.error(`Error al enviar correo para pedido ${order.id}:`, err.message);
    await OrderVerification.updateEstado(verification.id, VERIFICATION_STATES.EXPIRADO);
    throw err;
  }
}

module.exports = { createOrderVerification, processOrderWithEmail };
