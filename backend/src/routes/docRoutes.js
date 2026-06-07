const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadDocument } = require('../controllers/docController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.post('/upload', authMiddleware, upload.single('pdf'), uploadDocument);

module.exports = router;