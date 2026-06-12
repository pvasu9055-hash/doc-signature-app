const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const signatureRoutes = require('./routes/signatureRoutes');
const emailRoutes = require('./routes/emailRoutes');
const auditRoutes = require('./routes/auditRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Document Signature API is running 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});