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

    // Save token to signature
    await prisma.signature.updateMany({
      where: { documentId: parseInt(documentId) },
      data: { status: 'pending' }
    });

    const signingLink = `${process.env.FRONTEND_URL}/sign/${token}?docId=${documentId}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: signerEmail,
      subject: `Document Signing Request - ${document.filename}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Document Signing Request</h2>
          <p>Hello <strong>${signerName}</strong>,</p>
          <p>You have been requested to sign the document: <strong>${document.filename}</strong></p>
          <div style="margin: 30px 0;">
            <a href="${signingLink}" 
               style="background: #2563eb; color: white; padding: 12px 24px; 
                      border-radius: 8px; text-decoration: none; font-weight: bold;">
              Click Here to Sign Document
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This link is unique and secure.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Signing link sent successfully!',
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