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

module.exports = { uploadDocument };