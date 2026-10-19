const pool = require('../config/db');

const Order = {
  async createWithDetails(client, { usuario_id, monto_total, items }) {
    const orderResult = await client.query(
      `INSERT INTO pedidos (usuario_id, monto_total, estado)
       VALUES ($1, $2, 'PENDIENTE_VERIFICACION')
       RETURNING *`,
      [usuario_id, monto_total]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
      );
    }

    return order;
  },

  async findByUser(usuarioId) {
    const { rows } = await pool.query(
      `SELECT p.*, json_agg(json_build_object(
         'producto_id', dp.producto_id,
         'nombre', pr.nombre,
         'cantidad', dp.cantidad,
         'precio_unitario', dp.precio_unitario,
         'subtotal', dp.subtotal
       )) AS detalles
       FROM pedidos p
       LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.fecha_creacion DESC`,
      [usuarioId]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findAllAdmin(estado = null) {
    let query = `
      SELECT p.*, u.nombre AS cliente_nombre, u.email AS cliente_email, u.telefono AS cliente_telefono,
        json_agg(json_build_object(
          'producto_id', dp.producto_id,
          'nombre', pr.nombre,
          'cantidad', dp.cantidad,
          'precio_unitario', dp.precio_unitario,
          'subtotal', dp.subtotal
        )) AS detalles
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
      LEFT JOIN productos pr ON dp.producto_id = pr.id
    `;
    const params = [];
    if (estado) {
      query += ' WHERE p.estado = $1';
      params.push(estado);
    }
    query += ' GROUP BY p.id, u.nombre, u.email, u.telefono ORDER BY p.fecha_creacion DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async updateStatus(id, estado) {
    const { rows } = await pool.query(
      'UPDATE pedidos SET estado = $2 WHERE id = $1 RETURNING *',
      [id, estado]
    );
    return rows[0] || null;
  },
};

module.exports = Order;
