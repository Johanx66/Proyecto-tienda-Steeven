const pool = require('../config/db');

const Product = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM productos WHERE activo = TRUE ORDER BY id ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ nombre, descripcion, precio, stock, imagen_url = null }) {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, descripcion, precio, stock, imagen_url]
    );
    return rows[0];
  },

  async update(id, { nombre, descripcion, precio, stock, imagen_url, activo }) {
    const { rows } = await pool.query(
      `UPDATE productos
       SET nombre = COALESCE($2, nombre),
           descripcion = COALESCE($3, descripcion),
           precio = COALESCE($4, precio),
           stock = COALESCE($5, stock),
           imagen_url = COALESCE($6, imagen_url),
           activo = COALESCE($7, activo)
       WHERE id = $1
       RETURNING *`,
      [id, nombre, descripcion, precio, stock, imagen_url, activo]
    );
    return rows[0] || null;
  },

  async decrementStock(client, productId, quantity) {
    await client.query('UPDATE productos SET stock = stock - $2 WHERE id = $1 AND stock >= $2', [
      productId,
      quantity,
    ]);
  },
};

module.exports = Product;
