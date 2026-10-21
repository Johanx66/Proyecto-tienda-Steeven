const OrderVerification = require('../models/OrderVerification');
const emailService = require('./emailService');
const { VERIFICATION_STATES } = require('../utils/constants');

async function processOrderWithEmail(order, user) {
  const ttlMinutes = Number(process.env.VERIFICATION_TOKEN_TTL_MINUTES) || 30;
  const verification = await OrderVerification.create({ pedido_id: order.id, ttlMinutes });

  try {
    await emailService.sendOrderConfirmation(order, user, verification.token);
    console.log(`Pedido ${order.id}: correo de confirmación enviado a ${user.email}`);
  } catch (err) {
    console.error(`Error al enviar correo para pedido ${order.id}:`, err.message);
    await OrderVerification.updateEstado(verification.id, VERIFICATION_STATES.EXPIRADO);
    throw err;
  }
}

module.exports = { processOrderWithEmail };
