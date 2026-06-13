require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, page, status } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: parseInt(documentId) }
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
        status: status || 'pending'
      }
    });

    // Update document status
    await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { status: status || 'pending' }
    });

    res.status(201).json({ message: 'Signature saved', signature });
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

const finalizeSignature = async (req, res) => {
  try {
    const { documentId, signerName } = req.body;
    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    const fs = require('fs');
    const path = require('path');

    const document = await prisma.document.findFirst({
      where: { id: parseInt(documentId) }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const signatures = await prisma.signature.findMany({
      where: { documentId: parseInt(documentId) }
    });

    const pdfPath = path.resolve(document.filepath);
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const sig of signatures) {
      const pages = pdfDoc.getPages();
      const page = pages[(sig.page - 1)] || pages[0];
      const { height } = page.getSize();

      page.drawText(`✍ ${signerName || 'Signed'}`, {
        x: sig.x, y: height - sig.y,
        size: 14, font, color: rgb(0, 0, 0.8),
      });
    }

    const signedPdfBytes = await pdfDoc.save();
    const signedFilename = `signed-${Date.now()}-${document.filename}`;
    const signedPath = path.join('uploads', signedFilename);
    fs.writeFileSync(signedPath, signedPdfBytes);

    await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { status: 'signed' }
    });

    res.json({ message: 'PDF signed!', signedFile: signedPath });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { saveSignature, getSignatures, finalizeSignature };