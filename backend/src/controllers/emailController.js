require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const generateSigningLink = async (req, res) => {
  try {
    const { documentId, signerEmail, signerName } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: parseInt(documentId), userId: req.user.userId }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const token = uuidv4();
    const signingLink = `${process.env.FRONTEND_URL}/sign/${token}?docId=${documentId}`;

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const senderName = req.user.name || 'DocSign User';
      const senderEmail = req.user.email || process.env.EMAIL_USER;

      const mailOptions = {
        from: `"${senderName} (via DocSign)" <${process.env.EMAIL_USER}>`,
        replyTo: senderEmail,
        to: signerEmail,
        subject: `Document Signing Request - ${document.filename}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Document Signing Request</h2>
            <p>Hello <strong>${signerName}</strong>,</p>
            <p><strong>${senderName}</strong> (${senderEmail}) has requested you to sign: <strong>${document.filename}</strong></p>
            <div style="margin: 30px 0;">
              <a href="${signingLink}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Click Here to Sign Document
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">This link is unique and secure. Reply to this email to contact ${senderName} directly.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('📧 Email sent to:', signerEmail, 'on behalf of', senderName);
    } catch (emailError) {
      console.log('📧 Mock email - would be sent to:', signerEmail);
      console.log('📧 Signing Link:', signingLink);
    }

    res.json({ message: 'Signing link generated successfully!', signingLink, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSigningRequest = async (req, res) => {
  try {
    const { token, docId } = req.query;

    if (!token || !docId) {
      return res.status(400).json({ message: 'Invalid signing link' });
    }

    const document = await prisma.document.findFirst({
      where: { id: parseInt(docId) }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: 'Valid signing request',
      document: { id: document.id, filename: document.filename, filepath: document.filepath },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const publicSign = async (req, res) => {
  try {
    const { token, docId, signerName, signerEmail, x, y, page, signatureImage } = req.body;

    if (!token || !docId) {
      return res.status(400).json({ message: 'Invalid signing request' });
    }

    const document = await prisma.document.findFirst({
      where: { id: parseInt(docId) }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let guestUser = await prisma.user.findFirst({
      where: { email: signerEmail || `guest-${token}@docsign.com` }
    });

    if (!guestUser) {
      const bcrypt = require('bcryptjs');
      guestUser = await prisma.user.create({
        data: {
          name: signerName || 'Guest Signer',
          email: signerEmail || `guest-${token}@docsign.com`,
          password: await bcrypt.hash(uuidv4(), 10)
        }
      });
    }

    await prisma.signature.create({
      data: {
        documentId: parseInt(docId),
        userId: guestUser.id,
        x: parseFloat(x) || 0,
        y: parseFloat(y) || 0,
        page: parseInt(page) || 1,
        status: 'signed',
        signatureImage: signatureImage || null
      }
    });

    await prisma.document.update({
      where: { id: parseInt(docId) },
      data: { status: 'signed' }
    });

    const ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    await prisma.auditLog.create({
      data: {
        documentId: parseInt(docId),
        userId: guestUser.id,
        action: `Document signed by external signer: ${signerName} (${signerEmail}) at ${new Date().toISOString()}`,
        ipAddress
      }
    });

    console.log(`✅ Public sign: ${signerName} signed document ${docId}`);
    res.json({ message: 'Document signed successfully!' });
  } catch (error) {
    console.error('Public sign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const publicFinalize = async (req, res) => {
  try {
    const { docId, signerName } = req.body;
    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    const fs = require('fs');
    const path = require('path');

    const document = await prisma.document.findFirst({
      where: { id: parseInt(docId) }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const signatures = await prisma.signature.findMany({
      where: { documentId: parseInt(docId) }
    });

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

      if (sig.signatureImage && sig.signatureImage.startsWith('data:image/png')) {
        try {
          const base64Data = sig.signatureImage.replace(/^data:image\/png;base64,/, '');
          const imageBytes = Buffer.from(base64Data, 'base64');
          const embeddedImage = await pdfDoc.embedPng(imageBytes);
          const imgHeight = 40;
          const imgWidth = (embeddedImage.width / embeddedImage.height) * imgHeight;
          page.drawImage(embeddedImage, { x: pdfX, y: pdfY - imgHeight, width: imgWidth, height: imgHeight });
        } catch {
          page.drawText(`Signed by: ${signerName || 'Signed'}`, { x: pdfX, y: pdfY, size: 14, font, color: rgb(0, 0, 0.8) });
        }
      } else {
        page.drawText(`Signed by: ${signerName || 'Signed'}`, { x: pdfX, y: pdfY, size: 14, font, color: rgb(0, 0, 0.8) });
      }
    }

    const signedPdfBytes = await pdfDoc.save();
    const signedFilename = `signed-${Date.now()}-${document.filename}`;
    const signedPath = path.join('uploads', signedFilename);
    fs.writeFileSync(signedPath, signedPdfBytes);

    await prisma.document.update({
      where: { id: parseInt(docId) },
      data: { status: 'signed', signedFilepath: signedPath }
    });

    res.json({ message: 'PDF finalized!', signedFile: signedPath });
  } catch (error) {
    console.error('Public finalize error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { generateSigningLink, getSigningRequest, publicSign, publicFinalize };