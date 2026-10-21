const pool = require('../config/db');
const { ROLES } = require('../utils/constants');

const User = {
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, telefono, rol, direccion_envio, fecha_creacion FROM usuarios WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({
    nombre,
    email,
    telefono,
    contrasenia,
    rol = ROLES.CLIENTE,
    direccion_envio = null,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, telefono, contrasenia, rol, direccion_envio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, email, telefono, rol, direccion_envio, fecha_creacion`,
      [nombre, email, telefono, contrasenia, rol, direccion_envio]
    );
    return rows[0];
  },
};

module.exports = User;
