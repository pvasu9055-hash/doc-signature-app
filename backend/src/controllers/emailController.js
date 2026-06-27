require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const senderName = req.user.name || 'DocSign User';
    const senderEmail = req.user.email || 'noreply@docsign.com';

    try {
      await resend.emails.send({
        from: 'DocSign <noreply@vasutech.online>',
        to: signerEmail,
        subject: `✍️ Signature Requested: ${document.filename}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
              
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">🖊️ DocSign</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Document Intelligence Platform</p>
              </div>

              <!-- Body -->
              <div style="padding:32px;">
                <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">Signature Requested</h2>
                <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 8px;">
                  Hello <strong style="color:#fff;">${signerName}</strong>,
                </p>
                <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px;">
                  <strong style="color:#f97316;">${senderName}</strong> has requested your signature on the following document:
                </p>

                <!-- Document card -->
                <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:28px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:32px;">📄</span>
                    <div>
                      <p style="color:#fff;font-weight:700;font-size:16px;margin:0;">${document.filename}</p>
                      <p style="color:#666;font-size:12px;margin:4px 0 0;">Requested by ${senderName} (${senderEmail})</p>
                    </div>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align:center;margin:28px 0;">
                  <a href="${signingLink}" 
                     style="background:linear-gradient(135deg,#f97316,#ef4444);color:white;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
                    ✍️ Sign Document Now
                  </a>
                </div>

                <!-- Info -->
                <div style="background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:16px;margin-top:24px;">
                  <p style="color:#555;font-size:12px;margin:0;line-height:1.8;">
                    🔒 This is a secure, legally binding signature request<br>
                    ⏰ Please sign at your earliest convenience<br>
                    ❓ Questions? Reply to this email to contact ${senderName}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
                <p style="color:#444;font-size:11px;margin:0;">
                  Powered by <strong style="color:#f97316;">DocSign</strong> • Legally binding in 180+ countries<br>
                  SOC 2 • HIPAA • eIDAS • ESIGN Act compliant
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log('📧 Email sent via Resend to:', signerEmail);
    } catch (emailError) {
      console.error('📧 Resend error:', emailError);
      console.log('📧 Signing Link (fallback):', signingLink);
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

    // Send confirmation email to signer
    try {
      await resend.emails.send({
        from: 'DocSign <onboarding@resend.dev>',
        to: signerEmail,
        subject: `✅ You've successfully signed: ${document.filename}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
            <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:28px;">✅ Signing Complete</h1>
              </div>
              <div style="padding:32px;">
                <p style="color:#aaa;font-size:15px;">Hello <strong style="color:#fff;">${signerName}</strong>,</p>
                <p style="color:#aaa;font-size:15px;">You have successfully signed <strong style="color:#fff;">${document.filename}</strong>.</p>
                <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0;">
                  <p style="color:#666;font-size:12px;margin:0;line-height:1.8;">
                    📅 Signed on: ${new Date().toLocaleString()}<br>
                    🔒 This signature is legally binding<br>
                    📄 Document: ${document.filename}
                  </p>
                </div>
              </div>
              <div style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
                <p style="color:#444;font-size:11px;margin:0;">Powered by <strong style="color:#f97316;">DocSign</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (e) {
      console.error('Confirmation email error:', e);
    }

    // Notify document owner
    try {
      const owner = await prisma.user.findFirst({ where: { id: document.userId } });
      if (owner?.email) {
        await resend.emails.send({
          from: 'DocSign <onboarding@resend.dev>',
          to: owner.email,
          subject: `🎉 ${signerName} signed your document!`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;">
                  <h1 style="color:white;margin:0;font-size:28px;">🎉 Document Signed!</h1>
                </div>
                <div style="padding:32px;">
                  <p style="color:#aaa;font-size:15px;">Hello <strong style="color:#fff;">${owner.name}</strong>,</p>
                  <p style="color:#aaa;font-size:15px;">
                    <strong style="color:#f97316;">${signerName}</strong> (${signerEmail}) has signed your document 
                    <strong style="color:#fff;">${document.filename}</strong>.
                  </p>
                  <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0;">
                    <p style="color:#666;font-size:12px;margin:0;line-height:1.8;">
                      📅 Signed on: ${new Date().toLocaleString()}<br>
                      ✍️ Signer: ${signerName} (${signerEmail})<br>
                      📄 Document: ${document.filename}
                    </p>
                  </div>
                  <div style="text-align:center;margin-top:24px;">
                    <a href="${process.env.FRONTEND_URL}" 
                       style="background:linear-gradient(135deg,#f97316,#ef4444);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">
                      View Dashboard →
                    </a>
                  </div>
                </div>
                <div style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
                  <p style="color:#444;font-size:11px;margin:0;">Powered by <strong style="color:#f97316;">DocSign</strong></p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      }
    } catch (e) {
      console.error('Owner notification email error:', e);
    }

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