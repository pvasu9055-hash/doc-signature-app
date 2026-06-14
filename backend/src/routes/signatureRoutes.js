const express = require('express');
const router = express.Router();
const { saveSignature, getSignatures, deleteSignatures, finalizeSignature } = require('../controllers/signatureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, saveSignature);
router.get('/:id', authMiddleware, getSignatures);
router.delete('/:id', authMiddleware, deleteSignatures);
router.post('/finalize', authMiddleware, finalizeSignature);

module.exports = router;