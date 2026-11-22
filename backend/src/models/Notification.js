const pool = require('../config/db');

const Notification = {
  async getPreferences(userId) {
    const { rows } = await pool.query(
      `INSERT INTO preferencias_notificacion (usuario_id) VALUES ($1)
       ON CONFLICT (usuario_id) DO UPDATE SET usuario_id = EXCLUDED.usuario_id
       RETURNING telegram_habilitado, push_habilitado, telegram_chat_id IS NOT NULL AS telegram_vinculado`,
      [userId]
    );
    return rows[0];
  },

  async updatePreferences(userId, { telegramEnabled, pushEnabled }) {
    const { rows } = await pool.query(
      `INSERT INTO preferencias_notificacion (usuario_id, telegram_habilitado, push_habilitado)
       VALUES ($1, COALESCE($2, FALSE), COALESCE($3, FALSE))
       ON CONFLICT (usuario_id) DO UPDATE SET
         telegram_habilitado = COALESCE($2, preferencias_notificacion.telegram_habilitado),
         push_habilitado = COALESCE($3, preferencias_notificacion.push_habilitado),
         fecha_actualizacion = NOW()
       RETURNING telegram_habilitado, push_habilitado,
         telegram_chat_id IS NOT NULL AS telegram_vinculado`,
      [userId, telegramEnabled ?? null, pushEnabled ?? null]
    );
    return rows[0];
  },

  async createTelegramLink(userId, tokenHash, expiresAt) {
    await pool.query('DELETE FROM vinculos_telegram WHERE usuario_id = $1 OR expira_en < NOW()', [
      userId,
    ]);
    await pool.query(
      'INSERT INTO vinculos_telegram (token_hash, usuario_id, expira_en) VALUES ($1, $2, $3)',
      [tokenHash, userId, expiresAt]
    );
  },

  async consumeTelegramLink(tokenHash, chatId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT usuario_id FROM vinculos_telegram
         WHERE token_hash = $1 AND expira_en > NOW() FOR UPDATE`,
        [tokenHash]
      );
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const userId = rows[0].usuario_id;
      await client.query('DELETE FROM vinculos_telegram WHERE token_hash = $1', [tokenHash]);
      await client.query(
        `INSERT INTO preferencias_notificacion (usuario_id, telegram_chat_id)
         VALUES ($1, $2)
         ON CONFLICT (usuario_id) DO UPDATE SET
           telegram_chat_id = EXCLUDED.telegram_chat_id,
           fecha_actualizacion = NOW()`,
        [userId, chatId]
      );
      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async unlinkTelegram(userId) {
    await pool.query('DELETE FROM vinculos_telegram WHERE usuario_id = $1', [userId]);
    await pool.query(
      `UPDATE preferencias_notificacion SET telegram_chat_id = NULL,
       telegram_habilitado = FALSE, fecha_actualizacion = NOW() WHERE usuario_id = $1`,
      [userId]
    );
  },

  async getPushSubscriptions(userId) {
    const { rows } = await pool.query(
      'SELECT endpoint, clave_p256dh, clave_auth FROM suscripciones_push WHERE usuario_id = $1',
      [userId]
    );
    return rows;
  },

  async getTelegramChatId(userId) {
    const { rows } = await pool.query(
      'SELECT telegram_chat_id FROM preferencias_notificacion WHERE usuario_id = $1',
      [userId]
    );
    return rows[0]?.telegram_chat_id || null;
  },

  async savePushSubscription(userId, subscription) {
    await pool.query(
      `INSERT INTO suscripciones_push (usuario_id, endpoint, clave_p256dh, clave_auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         usuario_id = EXCLUDED.usuario_id, clave_p256dh = EXCLUDED.clave_p256dh,
         clave_auth = EXCLUDED.clave_auth`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );
    await this.updatePreferences(userId, { pushEnabled: true });
  },

  async removePushSubscriptions(userId) {
    await pool.query('DELETE FROM suscripciones_push WHERE usuario_id = $1', [userId]);
    await this.updatePreferences(userId, { pushEnabled: false });
  },

  async removePushEndpoint(endpoint) {
    const { rows } = await pool.query(
      'DELETE FROM suscripciones_push WHERE endpoint = $1 RETURNING usuario_id',
      [endpoint]
    );
    if (rows[0]) {
      const { rowCount } = await pool.query(
        'SELECT 1 FROM suscripciones_push WHERE usuario_id = $1 LIMIT 1',
        [rows[0].usuario_id]
      );
      if (rowCount === 0) await this.updatePreferences(rows[0].usuario_id, { pushEnabled: false });
    }
  },

  async create({ userId, type, title, message, data = {} }) {
    const { rows } = await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );
    return rows[0];
  },

  async list(userId) {
    const { rows } = await pool.query(
      `SELECT id, tipo, titulo, mensaje, datos, leida_en, fecha_creacion
       FROM notificaciones WHERE usuario_id = $1
       ORDER BY fecha_creacion DESC LIMIT 50`,
      [userId]
    );
    return rows;
  },

  async markRead(userId, notificationId) {
    const { rows } = await pool.query(
      `UPDATE notificaciones SET leida_en = COALESCE(leida_en, NOW())
       WHERE id = $1 AND usuario_id = $2 RETURNING id, leida_en`,
      [notificationId, userId]
    );
    return rows[0] || null;
  },
};

module.exports = Notification;
