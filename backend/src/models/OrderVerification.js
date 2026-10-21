const crypto = require('crypto');
const pool = require('../config/db');

const OrderVerification = {
  async create({ pedido_id, ttlMinutes = 30 }) {
    const token = crypto.randomBytes(32).toString('hex');
    const { rows } = await pool.query(
      `INSERT INTO verificaciones_pedido (pedido_id, token, estado, expira_en)
       VALUES ($1, $2, 'PENDIENTE', NOW() + ($3 || ' minutes')::interval)
       RETURNING *`,
      [pedido_id, token, ttlMinutes]
    );
    return rows[0];
  },

  async findByToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM verificaciones_pedido WHERE token = $1',
      [token]
    );
    return rows[0] || null;
  },

  async findLatestByOrder(pedidoId) {
    const { rows } = await pool.query(
      'SELECT * FROM verificaciones_pedido WHERE pedido_id = $1 ORDER BY fecha_creacion DESC LIMIT 1',
      [pedidoId]
    );
    return rows[0] || null;
  },

  async updateEstado(id, estado) {
    const { rows } = await pool.query(
      'UPDATE verificaciones_pedido SET estado = $2 WHERE id = $1 RETURNING *',
      [id, estado]
    );
    return rows[0] || null;
  },
};

module.exports = OrderVerification;
