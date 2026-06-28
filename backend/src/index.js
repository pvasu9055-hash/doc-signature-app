const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const emailRoutes = require('./routes/emailRoutes');
const auditRoutes = require('./routes/auditRoutes');
const aiRoutes = require('./routes/aiRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes'); // ADD THIS

dotenv.config();

// Auto-create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/2fa', twoFactorRoutes); // ADD THIS

app.get('/', (req, res) => {
  res.json({
    message: 'Document Signature API is running 🚀'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});