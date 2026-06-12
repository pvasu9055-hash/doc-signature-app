const express = require('express');
const router = express.Router();
const { generateSigningLink, getSigningRequest } = require('../controllers/emailController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send-link', authMiddleware, generateSigningLink);
router.get('/sign', getSigningRequest);

module.exports = router;