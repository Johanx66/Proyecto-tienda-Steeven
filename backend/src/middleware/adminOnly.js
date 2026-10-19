const { ROLES } = require('../utils/constants');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
  }
  next();
}

module.exports = { requireAdmin };
