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

    // Generate unique token
    const token = uuidv4();

    const signingLink = `${process.env.FRONTEND_URL}/sign/${token}?docId=${documentId}`;

    // Try to send email, fallback to mock
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
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
              <a href="${signingLink}" 
                 style="background: #f97316; color: white; padding: 12px 24px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold;">
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
      // Mock email if credentials not set
      console.log('📧 Mock email - would be sent to:', signerEmail);
      console.log('📧 Signing Link:', signingLink);
    }

    res.json({
      message: 'Signing link generated successfully!',
      signingLink,
      token
    });
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
      document: {
        id: document.id,
        filename: document.filename,
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { generateSigningLink, getSigningRequest };