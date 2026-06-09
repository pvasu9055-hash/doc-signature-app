const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: parseInt(documentId), userId: req.user.userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const signature = await prisma.signature.create({
      data: {
        documentId: parseInt(documentId),
        userId: req.user.userId,
        x: parseFloat(x),
        y: parseFloat(y),
        page: parseInt(page) || 1,
        status: 'pending'
      }
    });

    res.status(201).json({ message: 'Signature position saved', signature });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSignatures = async (req, res) => {
  try {
    const signatures = await prisma.signature.findMany({
      where: { documentId: parseInt(req.params.id) }
    });

    res.json({ signatures });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { saveSignature, getSignatures };