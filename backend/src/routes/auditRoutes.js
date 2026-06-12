const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:fileId', authMiddleware, getAuditLogs);

module.exports = router;