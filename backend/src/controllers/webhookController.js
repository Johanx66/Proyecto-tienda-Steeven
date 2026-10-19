const pool = require('../config/db');
const Order = require('../models/Order');
const CallLog = require('../models/CallLog');
const Product = require('../models/Product');
const { generateTwiML, generateNoAnswerTwiML } = require('../services/twilioService');
const { handleRetry } = require('../services/orderService');
const { ORDER_STATES, CALL_STATES } = require('../utils/constants');

async function outbound(req, res) {
  const { pedido_id } = req.query;
  if (!pedido_id) {
    return res.status(400).type('text/xml').send(generateNoAnswerTwiML());
  }
  res.type('text/xml').send(generateTwiML(pedido_id));
}

async function response(req, res) {
  const { pedido_id } = req.query;
  const digits = req.body.Digits;
  const callStatus = req.body.CallStatus;

  if (!pedido_id) {
    return res.status(400).json({ error: 'pedido_id requerido' });
  }

  const pedido = await Order.findById(pedido_id);
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  const callLog = await CallLog.findLatestByOrder(pedido_id);

  if (!digits) {
    if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer') {
      if (callLog) {
        await CallLog.updateResponse(callLog.id, null, CALL_STATES.SIN_RESPUESTA);
      }
      handleRetry(pedido_id, callLog ? callLog.intentos : 1);
      return res.type('text/xml').send(generateNoAnswerTwiML());
    }
    return res.type('text/xml').send(generateNoAnswerTwiML());
  }

  if (digits === '1') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE pedidos SET estado = $2 WHERE id = $1', [pedido_id, ORDER_STATES.CONFIRMADO]);
      const { rows: detalles } = await client.query(
        'SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = $1',
        [pedido_id]
      );
      for (const det of detalles) {
        await Product.decrementStock(client, det.producto_id, det.cantidad);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error al confirmar pedido:', err);
    } finally {
      client.release();
    }
    if (callLog) {
      await CallLog.updateResponse(callLog.id, '1', CALL_STATES.COMPLETADA);
    }
    return res.type('text/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-MX">Su pedido ha sido confirmado. Gracias por su compra.</Say><Hangup/></Response>'
    );
  }

  if (digits === '2') {
    await Order.updateStatus(pedido_id, ORDER_STATES.CANCELADO_FRAUDE);
    if (callLog) {
      await CallLog.updateResponse(callLog.id, '2', CALL_STATES.COMPLETADA);
    }
    console.warn(`ALERTA DE SEGURIDAD: Pedido ${pedido_id} cancelado por fraude. Cliente reportó compra no autorizada.`);
    return res.type('text/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-MX">Su pedido ha sido cancelado y un agente de seguridad revisará el caso.</Say><Hangup/></Response>'
    );
  }

  if (callLog) {
    await CallLog.updateResponse(callLog.id, null, CALL_STATES.SIN_RESPUESTA);
  }
  handleRetry(pedido_id, callLog ? callLog.intentos : 1);
  return res.type('text/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="es-MX">Opción no válida.</Say><Hangup/></Response>'
  );
}

module.exports = { outbound, response };
