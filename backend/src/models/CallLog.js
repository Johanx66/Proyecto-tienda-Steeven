const pool = require('../config/db');

const CallLog = {
  async create({ pedido_id, telefono_destino, estado_llamada, intentos = 1 }) {
    const { rows } = await pool.query(
      `INSERT INTO registros_llamadas (pedido_id, telefono_destino, estado_llamada, intentos)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [pedido_id, telefono_destino, estado_llamada, intentos]
    );
    return rows[0];
  },

  async findByOrder(pedidoId) {
    const { rows } = await pool.query(
      'SELECT * FROM registros_llamadas WHERE pedido_id = $1 ORDER BY fecha_hora DESC',
      [pedidoId]
    );
    return rows;
  },

  async findLatestByOrder(pedidoId) {
    const { rows } = await pool.query(
      'SELECT * FROM registros_llamadas WHERE pedido_id = $1 ORDER BY fecha_hora DESC LIMIT 1',
      [pedidoId]
    );
    return rows[0] || null;
  },

  async updateResponse(id, respuesta_dtmf, estado_llamada) {
    const { rows } = await pool.query(
      'UPDATE registros_llamadas SET respuesta_dtmf = $2, estado_llamada = $3 WHERE id = $1 RETURNING *',
      [id, respuesta_dtmf, estado_llamada]
    );
    return rows[0] || null;
  },

  async incrementAttempts(id) {
    const { rows } = await pool.query(
      'UPDATE registros_llamadas SET intentos = intentos + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT r.*, p.estado AS pedido_estado, p.monto_total, u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
       FROM registros_llamadas r
       JOIN pedidos p ON r.pedido_id = p.id
       JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY r.fecha_hora DESC`
    );
    return rows;
  },
};

module.exports = CallLog;
