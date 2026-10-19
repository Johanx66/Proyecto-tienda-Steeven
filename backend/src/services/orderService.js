const pool = require('../config/db');
const twilioService = require('./twilioService');
const Order = require('../models/Order');
const CallLog = require('../models/CallLog');
const { ORDER_STATES, CALL_STATES, MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } = require('../utils/constants');

async function processOrderWithCall(orderId, telefono) {
  try {
    await CallLog.create({
      pedido_id: orderId,
      telefono_destino: telefono,
      estado_llamada: CALL_STATES.INICIADA,
      intentos: 1,
    });
    const callUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/twilio/outbound?pedido_id=${orderId}`;
    await twilioService.makeCall(telefono, callUrl);
  } catch (err) {
    console.error(`Error al iniciar llamada para pedido ${orderId}:`, err.message);
    await CallLog.create({
      pedido_id: orderId,
      telefono_destino: telefono,
      estado_llamada: CALL_STATES.FALLIDA,
      intentos: 1,
    });
  }
}

function handleRetry(orderId, attempt) {
  if (attempt >= MAX_RETRY_ATTEMPTS) {
    console.log(`Pedido ${orderId}: máximo de reintentos alcanzado (${attempt}). Marcando NO_CONTESTO.`);
    pool.query(
      'UPDATE pedidos SET estado = $2 WHERE id = $1 AND estado = $3',
      [orderId, ORDER_STATES.NO_CONTESTO, ORDER_STATES.PENDIENTE_VERIFICACION]
    ).catch((e) => console.error(e));
    return;
  }
  console.log(`Pedido ${orderId}: reintento ${attempt + 1}/${MAX_RETRY_ATTEMPTS} en ${RETRY_DELAY_MS / 1000}s`);
  setTimeout(async () => {
    try {
      const pedido = await Order.findById(orderId);
      if (!pedido || pedido.estado !== ORDER_STATES.PENDIENTE_VERIFICACION) return;
      const callLog = await CallLog.findLatestByOrder(orderId);
      if (!callLog) return;
      await CallLog.incrementAttempts(callLog.id);
      const userQuery = await pool.query('SELECT telefono FROM usuarios WHERE id = $1', [pedido.usuario_id]);
      const telefono = userQuery.rows[0]?.telefono;
      if (!telefono) return;
      const callUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/twilio/outbound?pedido_id=${orderId}`;
      await twilioService.makeCall(telefono, callUrl);
    } catch (err) {
      console.error(`Error en reintento para pedido ${orderId}:`, err.message);
    }
  }, RETRY_DELAY_MS);
}

module.exports = { processOrderWithCall, handleRetry };
