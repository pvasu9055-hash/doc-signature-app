const express = require('express');
const router = express.Router();
const { saveSignature, getSignatures } = require('../controllers/signatureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, saveSignature);
router.get('/:id', authMiddleware, getSignatures);

module.exports = router;