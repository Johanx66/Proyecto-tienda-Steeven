const { Router } = require('express');
const { outbound, response } = require('../controllers/webhookController');

const router = Router();

router.post('/outbound', outbound);
router.post('/response', response);

module.exports = router;
