const pool = require('../config/db');
const Order = require('../models/Order');
const OrderVerification = require('../models/OrderVerification');
const User = require('../models/User');
const { ORDER_STATES, VERIFICATION_STATES } = require('../utils/constants');
const { notifyOrderConfirmed } = require('../services/notificationService');
const { releaseExpiredOrders } = require('../services/orderExpirationService');

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
    return res.status(400).send(
      renderPage({
        title: 'Enlace inválido',
        message: 'El enlace de confirmación no es válido.',
        variant: 'danger',
      })
    );
  }

  try {
    const verification = await OrderVerification.findByToken(token);
    if (!verification) {
      return res.status(404).send(
        renderPage({
          title: 'Enlace no encontrado',
          message: 'No encontramos esta solicitud de confirmación.',
          variant: 'danger',
        })
      );
    }

    if (
      verification.estado === VERIFICATION_STATES.EXPIRADO ||
      new Date(verification.expira_en) < new Date()
    ) {
      await releaseExpiredOrders({ verificationId: verification.id, limit: 1 });
      return res.status(410).send(
        renderPage({
          title: 'Enlace expirado',
          message: 'El enlace de confirmación ha expirado. Realiza un nuevo pedido.',
          variant: 'secondary',
        })
      );
    }

    if (verification.estado !== VERIFICATION_STATES.PENDIENTE) {
      return res.status(409).send(
        renderPage({
          title: 'Solicitud ya procesada',
          message: 'Este pedido ya fue confirmado o cancelado anteriormente.',
          variant: 'secondary',
        })
      );
    }

    const pedido = await Order.findById(verification.pedido_id);
    if (!pedido) {
      return res.status(404).send(
        renderPage({
          title: 'Pedido no encontrado',
          message: 'El pedido asociado ya no existe.',
          variant: 'danger',
        })
      );
    }

    if (pedido.estado !== ORDER_STATES.PENDIENTE_VERIFICACION) {
      return res.status(409).send(
        renderPage({
          title: 'Pedido ya procesado',
          message: `El pedido #${pedido.id} ya se encuentra en estado ${pedido.estado}.`,
          variant: 'secondary',
        })
      );
    }

    if (action === 'approve') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rowCount: verificationUpdated } = await client.query(
          `UPDATE verificaciones_pedido SET estado = $2
           WHERE id = $1 AND estado = $3 AND expira_en > NOW() RETURNING id`,
          [verification.id, VERIFICATION_STATES.APROBADO, VERIFICATION_STATES.PENDIENTE]
        );
        if (verificationUpdated === 0) {
          await client.query('ROLLBACK');
          return res.status(409).send(
            renderPage({
              title: 'Solicitud ya procesada',
              message: 'Este pedido ya fue confirmado, cancelado o expiró.',
              variant: 'secondary',
            })
          );
        }

        const { rows: orders } = await client.query(
          'SELECT estado, stock_descontado FROM pedidos WHERE id = $1 FOR UPDATE',
          [pedido.id]
        );
        if (!orders[0] || orders[0].estado !== ORDER_STATES.PENDIENTE_VERIFICACION) {
          await client.query('ROLLBACK');
          return res.status(409).send(
            renderPage({
              title: 'Pedido ya procesado',
              message: `El pedido #${pedido.id} ya se procesó anteriormente.`,
              variant: 'secondary',
            })
          );
        }

        if (!orders[0].stock_descontado) {
          const { rows: details } = await client.query(
            `SELECT producto_id, SUM(cantidad)::INT AS cantidad
             FROM detalle_pedidos WHERE pedido_id = $1
             GROUP BY producto_id ORDER BY producto_id`,
            [pedido.id]
          );
          for (const detail of details) {
            const { rowCount } = await client.query(
              `UPDATE productos SET stock = stock - $2
               WHERE id = $1 AND stock >= $2 RETURNING id`,
              [detail.producto_id, detail.cantidad]
            );
            if (rowCount === 0) {
              await client.query('ROLLBACK');
              return res.status(409).send(
                renderPage({
                  title: 'Stock insuficiente',
                  message:
                    'Uno de los productos ya no tiene stock suficiente. Contacta a la tienda.',
                  variant: 'danger',
                })
              );
            }
          }
        }
        await client.query(
          `UPDATE pedidos SET estado = $2, stock_descontado = TRUE WHERE id = $1`,
          [pedido.id, ORDER_STATES.CONFIRMADO]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      console.log(`Pedido ${pedido.id}: confirmado por correo.`);
      User.findById(pedido.usuario_id)
        .then((user) => user && notifyOrderConfirmed(pedido, user))
        .catch((err) =>
          console.error(`Error notificando la confirmación del pedido ${pedido.id}:`, err.message)
        );
      return res.send(
        renderPage({
          title: '¡Pedido confirmado!',
          message: `Tu pedido #${pedido.id} fue autorizado y será despachado.`,
          variant: 'success',
        })
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rowCount: verificationUpdated } = await client.query(
        `UPDATE verificaciones_pedido SET estado = $2
         WHERE id = $1 AND estado = $3 AND expira_en > NOW() RETURNING id`,
        [verification.id, VERIFICATION_STATES.RECHAZADO, VERIFICATION_STATES.PENDIENTE]
      );
      if (verificationUpdated === 0) {
        await client.query('ROLLBACK');
        return res.status(409).send(
          renderPage({
            title: 'Solicitud ya procesada',
            message: 'Este pedido ya fue confirmado, cancelado o expiró.',
            variant: 'secondary',
          })
        );
      }

      const { rows: orders } = await client.query(
        'SELECT estado, stock_descontado FROM pedidos WHERE id = $1 FOR UPDATE',
        [pedido.id]
      );
      if (!orders[0] || orders[0].estado !== ORDER_STATES.PENDIENTE_VERIFICACION) {
        await client.query('ROLLBACK');
        return res.status(409).send(
          renderPage({
            title: 'Pedido ya procesado',
            message: `El pedido #${pedido.id} ya se procesó anteriormente.`,
            variant: 'secondary',
          })
        );
      }

      await client.query(`UPDATE pedidos SET estado = $2, stock_descontado = FALSE WHERE id = $1`, [
        pedido.id,
        ORDER_STATES.CANCELADO_FRAUDE,
      ]);
      if (orders[0].stock_descontado) {
        await client.query(
          `UPDATE productos AS p
           SET stock = p.stock + d.cantidad
           FROM (
             SELECT producto_id, SUM(cantidad)::INT AS cantidad
             FROM detalle_pedidos WHERE pedido_id = $1
             GROUP BY producto_id
           ) AS d
           WHERE p.id = d.producto_id`,
          [pedido.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    console.warn(
      `ALERTA DE SEGURIDAD: Pedido ${pedido.id} cancelado por fraude. Cliente reportó compra no autorizada.`
    );
    return res.send(
      renderPage({
        title: 'Pedido cancelado',
        message: `Tu pedido #${pedido.id} fue cancelado y un agente de seguridad revisará el caso.`,
        variant: 'danger',
      })
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { confirm };
