const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await prisma.document.create({
      data: {
        filename: req.file.originalname,
        filepath: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        userId: req.user.userId,
      }
    });

    res.status(201).json({ message: 'File uploaded successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { uploadDocument, getDocuments, getDocument };