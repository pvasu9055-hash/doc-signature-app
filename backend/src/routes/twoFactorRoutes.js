const express = require('express');
const router = express.Router();
const {
  enableTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  disableTwoFactor
} = require('../controllers/twoFactorController');

// Enable 2FA - Get QR code
router.post('/enable', enableTwoFactor);

// Verify 2FA setup - User scans QR and enters code
router.post('/verify-setup', verifyTwoFactorSetup);

// Verify 2FA at login
router.post('/verify-login', verifyTwoFactorLogin);

// Disable 2FA
router.post('/disable', disableTwoFactor);

module.exports = router;