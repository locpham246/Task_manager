const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/track-activity', protect, authController.trackActivity); 
router.post('/google', authController.googleLogin);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logoutTrack);
router.post('/refresh', protect, authController.refreshToken); // Refresh token with latest role from database

// Test endpoint to verify backend is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌',
    jwtSecret: process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌',
    dbConfig: {
      user: process.env.DB_USER ? 'Set ✅' : 'Missing ❌',
      host: process.env.DB_HOST || 'Not set',
      database: process.env.DB_NAME ? 'Set ✅' : 'Missing ❌',
      port: process.env.DB_PORT || 'Not set'
    }
  });
});

module.exports = router;