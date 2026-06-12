const express = require('express');
const router = express.Router();
const { saveSignature, getSignatures, finalizeSignature } = require('../controllers/signatureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, saveSignature);
router.get('/:id', authMiddleware, getSignatures);
router.post('/finalize', authMiddleware, finalizeSignature);

module.exports = router;