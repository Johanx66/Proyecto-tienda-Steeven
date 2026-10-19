const { Router } = require('express');
const { list } = require('../controllers/callLogController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminOnly');

const router = Router();

router.get('/', verifyToken, requireAdmin, list);

module.exports = router;
