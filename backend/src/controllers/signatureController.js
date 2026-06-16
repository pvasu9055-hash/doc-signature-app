require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, page, status, reason, signatureImage } = req.body;

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
        status: status || 'pending',
        reason: reason || null,
        signatureImage: signatureImage || null
      }
    });

    await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { status: status || 'pending' }
    });

    // Log audit trail with IP and timestamp
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await prisma.auditLog.create({
      data: {
        documentId: parseInt(documentId),
        userId: req.user.userId,
        action: `Document ${status || 'pending'} by user at ${new Date().toISOString()}`,
        ipAddress: ipAddress.toString()
      }
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

const deleteSignatures = async (req, res) => {
  try {
    await prisma.signature.deleteMany({
      where: { documentId: parseInt(req.params.id) }
    });
    res.json({ message: 'Old signatures cleared' });
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

    console.log('📋 Found', signatures.length, 'signatures to embed');

    const pdfPath = path.resolve(document.filepath);
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const RENDER_WIDTH = 900;

    for (const sig of signatures) {
      const pages = pdfDoc.getPages();
      const page = pages[(sig.page - 1)] || pages[0];
      const { width, height } = page.getSize();

      const scale = width / RENDER_WIDTH;
      const pdfX = Math.max(0, Math.min(sig.x * scale, width - 150));
      let pdfY = height - (sig.y * scale);
      pdfY = Math.max(20, Math.min(pdfY, height - 50));

      console.log(`🖋️ Embedding signature ${sig.id} at (${Math.round(pdfX)}, ${Math.round(pdfY)})`);
      console.log(`   Has image: ${sig.signatureImage ? 'YES (length: ' + sig.signatureImage.length + ')' : 'NO'}`);

      if (sig.signatureImage && sig.signatureImage.startsWith('data:image/png')) {
        try {
          const base64Data = sig.signatureImage.replace(/^data:image\/png;base64,/, '');
          const imageBytes = Buffer.from(base64Data, 'base64');
          const embeddedImage = await pdfDoc.embedPng(imageBytes);

          const imgHeight = 40;
          const imgWidth = (embeddedImage.width / embeddedImage.height) * imgHeight;

          page.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY - imgHeight,
            width: imgWidth,
            height: imgHeight,
          });
          console.log(`   ✅ Image embedded successfully`);
        } catch (imgError) {
          console.error(`   ❌ Image embed error:`, imgError.message);
          page.drawText(`Signed by: ${signerName || 'Signed'}`, {
            x: pdfX, y: pdfY,
            size: 14, font, color: rgb(0, 0, 0.8),
          });
          console.log(`   ⚠️  Fell back to text signature`);
        }
      } else {
        page.drawText(`Signed by: ${signerName || 'Signed'}`, {
          x: pdfX, y: pdfY,
          size: 14, font, color: rgb(0, 0, 0.8),
        });
        console.log(`   📝 Using text signature (no image)`);
      }
    }

    const signedPdfBytes = await pdfDoc.save();
    const signedFilename = `signed-${Date.now()}-${document.filename}`;
    const signedPath = path.join('uploads', signedFilename);
    fs.writeFileSync(signedPath, signedPdfBytes);

    await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { status: 'signed', signedFilepath: signedPath }
    });

    // Log audit trail for finalize
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await prisma.auditLog.create({
      data: {
        documentId: parseInt(documentId),
        userId: req.user.userId,
        action: `Document signed and PDF generated at ${new Date().toISOString()}`,
        ipAddress: ipAddress.toString()
      }
    });

    console.log('✅ PDF signed and saved:', signedPath);
    res.json({ message: 'PDF signed!', signedFile: signedPath });
  } catch (error) {
    console.error('❌ Finalize error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { saveSignature, getSignatures, deleteSignatures, finalizeSignature };