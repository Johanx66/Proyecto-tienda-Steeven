const pool = require('../config/db');
const Order = require('../models/Order');
const { processOrderWithEmail } = require('../services/orderService');
const { ORDER_STATES } = require('../utils/constants');

async function create(req, res, next) {
  const client = await pool.connect();
  try {
    const { items, direccion_envio } = req.body;
    const usuarioId = req.user.id;

    await client.query('BEGIN');

    let montoTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { rows } = await client.query(
        'SELECT * FROM productos WHERE id = $1 AND activo = TRUE FOR UPDATE',
        [item.producto_id]
      );
      const product = rows[0];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto ${item.producto_id} no encontrado` });
      }
      if (product.stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}`,
        });
      }
      const subtotal = parseFloat(product.precio) * item.cantidad;
      montoTotal += subtotal;
      processedItems.push({
        producto_id: product.id,
        cantidad: item.cantidad,
        precio_unitario: product.precio,
        subtotal,
      });
    }

    const order = await Order.createWithDetails(client, {
      usuario_id: usuarioId,
      monto_total: montoTotal,
      items: processedItems,
    });

    await client.query('UPDATE usuarios SET direccion_envio = $2 WHERE id = $1', [
      usuarioId,
      direccion_envio,
    ]);

    await client.query('COMMIT');

    processOrderWithEmail(order, req.user).catch((err) =>
      console.error(`Error al procesar verificación del pedido ${order.id}:`, err.message)
    );

    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function myOrders(req, res, next) {
  try {
    const orders = await Order.findByUser(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function adminOrders(req, res, next) {
  try {
    const { estado } = req.query;
    const orders = await Order.findAllAdmin(estado || null);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function despachar(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.estado !== ORDER_STATES.CONFIRMADO) {
      return res.status(400).json({ error: 'Solo se pueden despachar pedidos CONFIRMADOS' });
    }
    const updated = await Order.updateStatus(id, ORDER_STATES.DESPACHADO);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, myOrders, adminOrders, despachar };
