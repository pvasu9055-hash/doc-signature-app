const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enable 2FA - Generate secret and QR code
const enableTwoFactor = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `DocSign (${user.email})`,
      issuer: 'DocSign',
      length: 32
    });

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      message: 'Scan QR code with Google Authenticator or Authy',
      qrCode,
      secret: secret.base32,
      tempSecret: secret.base32 // For verification
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify 2FA Setup - User enters code from app to confirm
const verifyTwoFactorSetup = async (req, res) => {
  try {
    const { userId, secret, code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid code format' });
    }

    // Verify the code against the secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid code. Please try again' });
    }

    // Save the secret to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true
      }
    });

    res.json({ message: '2FA enabled successfully!' });
  } catch (error) {
    console.error('Verify 2FA setup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify 2FA at Login
const verifyTwoFactorLogin = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid code format' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not enabled for this account' });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }

    res.json({ message: '2FA verified successfully', verified: true });
  } catch (error) {
    console.error('Verify 2FA login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Disable 2FA
const disableTwoFactor = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before disabling
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  enableTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  disableTwoFactor
};