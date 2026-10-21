const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Errores de validación', details: errors.array() });
  }
  next();
}

const registerRules = [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('telefono')
    .trim()
    .notEmpty()
    .withMessage('Teléfono es requerido')
    .matches(/^\+?[0-9]{8,15}$/)
    .withMessage('Teléfono inválido (formato E.164)'),
  body('contrasenia').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('contrasenia').notEmpty().withMessage('Contraseña es requerida'),
];

const productRules = [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido').isLength({ max: 100 }),
  body('precio').isFloat({ gt: 0 }).withMessage('Precio debe ser mayor a 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock debe ser un entero >= 0'),
];

const orderRules = [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.producto_id').isInt({ gt: 0 }).withMessage('producto_id inválido'),
  body('items.*.cantidad').isInt({ gt: 0 }).withMessage('cantidad debe ser > 0'),
  body('direccion_envio').trim().notEmpty().withMessage('Dirección de envío es requerida'),
];

module.exports = { handleValidation, registerRules, loginRules, productRules, orderRules };
