const Product = require('../models/Product');

async function list(req, res, next) {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, descripcion, precio, stock, imagen_url } = req.body;
    const product = await Product.create({ nombre, descripcion, precio, stock, imagen_url });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const product = await Product.update(id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update };
