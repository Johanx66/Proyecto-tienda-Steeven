const { Router } = require('express');
const { list, create, update } = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminOnly');
const { productRules, handleValidation } = require('../middleware/validation');

const router = Router();

router.get('/', list);
router.post('/', verifyToken, requireAdmin, productRules, handleValidation, create);
router.put('/:id', verifyToken, requireAdmin, update);

module.exports = router;
