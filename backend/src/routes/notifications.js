const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/notificationController');

const router = Router();

router.post('/telegram/webhook', controller.telegramWebhook);
router.use(verifyToken);
router.get('/', controller.getMine);
router.put('/preferences', controller.updatePreferences);
router.post('/telegram/link', controller.createTelegramLink);
router.delete('/telegram/link', controller.unlinkTelegram);
router.post('/push/subscription', controller.savePushSubscription);
router.delete('/push/subscription', controller.disablePush);
router.put('/:id/read', controller.markRead);

module.exports = router;
