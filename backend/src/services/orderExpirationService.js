const pool = require('../config/db');
const { ORDER_STATES, VERIFICATION_STATES } = require('../utils/constants');

async function releaseExpiredOrders({ limit = 100, verificationId = null } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: expiredOrders } = await client.query(
      `SELECT v.id AS verification_id, p.id AS order_id, p.stock_descontado
       FROM verificaciones_pedido v
       JOIN pedidos p ON p.id = v.pedido_id
       WHERE p.estado = $1
         AND (v.estado = $2 OR (v.estado = $3 AND v.expira_en <= NOW()))
         AND ($4::INT IS NULL OR v.id = $4)
       ORDER BY v.id
       LIMIT $5
       FOR UPDATE OF v, p SKIP LOCKED`,
      [
        ORDER_STATES.PENDIENTE_VERIFICACION,
        VERIFICATION_STATES.EXPIRADO,
        VERIFICATION_STATES.PENDIENTE,
        verificationId,
        limit,
      ]
    );

    for (const order of expiredOrders) {
      await client.query('UPDATE verificaciones_pedido SET estado = $2 WHERE id = $1', [
        order.verification_id,
        VERIFICATION_STATES.EXPIRADO,
      ]);
      const { rowCount } = await client.query(
        `UPDATE pedidos SET estado = $2, stock_descontado = FALSE
         WHERE id = $1 AND estado = $3`,
        [order.order_id, ORDER_STATES.NO_CONFIRMADO, ORDER_STATES.PENDIENTE_VERIFICACION]
      );
      if (rowCount === 0 || !order.stock_descontado) continue;

      await client.query(
        `UPDATE productos AS p
         SET stock = p.stock + d.cantidad
         FROM (
           SELECT producto_id, SUM(cantidad)::INT AS cantidad
           FROM detalle_pedidos
           WHERE pedido_id = $1
           GROUP BY producto_id
         ) AS d
         WHERE p.id = d.producto_id`,
        [order.order_id]
      );
    }

    await client.query('COMMIT');
    return expiredOrders.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { releaseExpiredOrders };
