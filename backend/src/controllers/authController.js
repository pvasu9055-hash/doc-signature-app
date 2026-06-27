require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const resend = new Resend(process.env.RESEND_API_KEY);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: 'google-oauth',
        }
      });
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      authToken: jwtToken,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — don't reveal if email exists
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: 'DocSign <noreply@vasutech.online>',
      to: email,
      subject: 'Reset your DocSign password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">✍️ DocSign</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Enterprise Document Signing</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 16px;">Reset Your Password</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      We received a request to reset the password for your DocSign account associated with <strong style="color:#f97316;">${email}</strong>.
                    </p>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                      Click the button below to reset your password. This link expires in <strong style="color:#f1f5f9;">1 hour</strong>.
                    </p>
                    <div style="text-align:center;margin:0 0 32px;">
                      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:700;">
                        🔐 Reset Password
                      </a>
                    </div>
                    <div style="background:#0f172a;border-radius:10px;padding:20px;margin:0 0 24px;">
                      <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">
                        ⚠️ If you didn't request this, you can safely ignore this email. Your password will not change.
                      </p>
                    </div>
                    <p style="color:#475569;font-size:12px;margin:0;">
                      Or copy this link: <span style="color:#f97316;word-break:break-all;">${resetUrl}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#0f172a;padding:24px 40px;text-align:center;">
                    <p style="color:#334155;font-size:12px;margin:0 0 8px;">© 2026 DocSign by VasuTech. All rights reserved.</p>
                    <p style="color:#1e293b;font-size:11px;margin:0;">🔒 SOC 2 &nbsp;•&nbsp; HIPAA &nbsp;•&nbsp; eIDAS &nbsp;•&nbsp; ESIGN Act</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = { register, login, googleLogin, forgotPassword, resetPassword };