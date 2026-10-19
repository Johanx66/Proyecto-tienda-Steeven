const { Router } = require('express');
const { create, myOrders, adminOrders, despachar } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminOnly');
const { orderRules, handleValidation } = require('../middleware/validation');

const router = Router();

router.post('/', verifyToken, orderRules, handleValidation, create);
router.get('/mis-pedidos', verifyToken, myOrders);
router.get('/admin', verifyToken, requireAdmin, adminOrders);
router.put('/:id/despachar', verifyToken, requireAdmin, despachar);

module.exports = router;
