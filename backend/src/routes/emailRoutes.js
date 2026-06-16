const express = require('express');
const router = express.Router();
const { generateSigningLink, getSigningRequest, publicSign, publicFinalize } = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send-link', authMiddleware, generateSigningLink);
router.get('/signing-request', getSigningRequest);
router.post('/public-sign', publicSign);
router.post('/public-finalize', publicFinalize);

module.exports = router;