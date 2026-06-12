require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logAudit = async (documentId, userId, action, ipAddress) => {
  try {
    await prisma.auditLog.create({
      data: {
        documentId: parseInt(documentId),
        userId: parseInt(userId),
        action,
        ipAddress: ipAddress || 'unknown'
      }
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { fileId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: { documentId: parseInt(fileId) },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { logAudit, getAuditLogs };