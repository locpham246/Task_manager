const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');
router.post('/track-activity', protect, authController.trackActivity); 
router.post('/google', authController.googleLogin);
router.get('/me', protect, authController.getMe);
module.exports = router;