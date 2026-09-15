const express = require('express');
const authenticateToken = require('../middlewares/AuthToken');
const controller = require('../controllers/pushNotificationController');

const router = express.Router();
router.get('/public-key', authenticateToken, controller.getPublicKey);
router.post('/subscribe', authenticateToken, controller.subscribe);
router.delete('/unsubscribe', authenticateToken, controller.unsubscribe);

module.exports = router;
