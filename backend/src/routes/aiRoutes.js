const express = require('express');
const router = express.Router();
const { summarizeDocument } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summarize/:documentId', authMiddleware, summarizeDocument);

module.exports = router;