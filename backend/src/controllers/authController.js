const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

async function register(req, res, next) {
  try {
    const { nombre, email, telefono, contrasenia } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    const hashed = await bcrypt.hash(contrasenia, 10);
    const user = await User.create({ nombre, email, telefono, contrasenia: hashed });
    const token = jwt.sign({ id: user.id, rol: user.rol }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, contrasenia } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(contrasenia, user.contrasenia);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, rol: user.rol }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });
    const { contrasenia: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
