const pool = require('../config/db');
const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderVerification = require('../models/OrderVerification');
const { ORDER_STATES, VERIFICATION_STATES } = require('../utils/constants');

function renderPage({ title, message, variant }) {
  const color = variant === 'success' ? '#198754' : variant === 'danger' ? '#dc3545' : '#6c757d';
  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f8f9fa; margin:0; padding:40px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.1);">
      <h2 style="color:#198754;margin-top:0;">Frutería Web</h2>
      <h3 style="color:${color};">${title}</h3>
      <p style="color:#495057;">${message}</p>
      <p style="margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
           style="color:#198754;">Volver a la tienda</a>
      </p>
    </div>
  </body>
  </html>`;
}

async function confirm(req, res, next) {
  const { token, action } = req.query;

  if (!token || !['approve', 'reject'].includes(action)) {
    return res.status(400).send(renderPage({
      title: 'Enlace inválido',
      message: 'El enlace de confirmación no es válido.',
      variant: 'danger',
    }));
  }

  try {
    const verification = await OrderVerification.findByToken(token);
    if (!verification) {
      return res.status(404).send(renderPage({
        title: 'Enlace no encontrado',
        message: 'No encontramos esta solicitud de confirmación.',
        variant: 'danger',
      }));
    }

    if (verification.estado !== VERIFICATION_STATES.PENDIENTE) {
      return res.status(409).send(renderPage({
        title: 'Solicitud ya procesada',
        message: 'Este pedido ya fue confirmado o cancelado anteriormente.',
        variant: 'secondary',
      }));
    }

    if (new Date(verification.expira_en) < new Date()) {
      await OrderVerification.updateEstado(verification.id, VERIFICATION_STATES.EXPIRADO);
      return res.status(410).send(renderPage({
        title: 'Enlace expirado',
        message: 'El enlace de confirmación ha expirado. Realiza un nuevo pedido.',
        variant: 'secondary',
      }));
    }

    const pedido = await Order.findById(verification.pedido_id);
    if (!pedido) {
      return res.status(404).send(renderPage({
        title: 'Pedido no encontrado',
        message: 'El pedido asociado ya no existe.',
        variant: 'danger',
      }));
    }

    if (pedido.estado !== ORDER_STATES.PENDIENTE_VERIFICACION) {
      return res.status(409).send(renderPage({
        title: 'Pedido ya procesado',
        message: `El pedido #${pedido.id} ya se encuentra en estado ${pedido.estado}.`,
        variant: 'secondary',
      }));
    }

    if (action === 'approve') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE pedidos SET estado = $2 WHERE id = $1', [pedido.id, ORDER_STATES.CONFIRMADO]);
        const { rows: detalles } = await client.query(
          'SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = $1',
          [pedido.id]
        );
        for (const det of detalles) {
          await Product.decrementStock(client, det.producto_id, det.cantidad);
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      await OrderVerification.updateEstado(verification.id, VERIFICATION_STATES.APROBADO);
      console.log(`Pedido ${pedido.id}: confirmado por correo.`);
      return res.send(renderPage({
        title: '¡Pedido confirmado!',
        message: `Tu pedido #${pedido.id} fue autorizado y será despachado.`,
        variant: 'success',
      }));
    }

    await Order.updateStatus(pedido.id, ORDER_STATES.CANCELADO_FRAUDE);
    await OrderVerification.updateEstado(verification.id, VERIFICATION_STATES.RECHAZADO);
    console.warn(`ALERTA DE SEGURIDAD: Pedido ${pedido.id} cancelado por fraude. Cliente reportó compra no autorizada.`);
    return res.send(renderPage({
      title: 'Pedido cancelado',
      message: `Tu pedido #${pedido.id} fue cancelado y un agente de seguridad revisará el caso.`,
      variant: 'danger',
    }));
  } catch (err) {
    next(err);
  }
}

module.exports = { confirm };
