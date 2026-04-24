const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Score = require('../models/Score');
const auth = require('../middleware/auth');

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file PDF dan Gambar yang diizinkan'));
    }
  }
});

/**
 * Upload & Parse Music Sheet
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });

    // SIMULASI PARSING OMR: Twinkle Twinkle Little Star
    const twinkleNotes = [
      // Bar 1: Twinkle twinkle
      'C3', 'C4', 'C4', 'G2', 'G4', 'G4', 
      // Bar 2: Little star
      'F2', 'A4', 'A4', 'C3', 'G4',
      // Bar 3: How I wonder
      'F2', 'F4', 'F4', 'C3', 'E4', 'E4',
      // Bar 4: What you are
      'G2', 'D4', 'D4', 'C3', 'C4'
    ];
    
    const score = await Score.create({
      title,
      originalFile: req.file.path,
      notes: twinkleNotes,
      userId: req.userId
    });

    res.status(201).json(score);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Ambil semua skor milik user
 */
router.get('/', auth, async (req, res) => {
  try {
    const scores = await Score.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Ambil detail skor
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const score = await Score.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!score) return res.status(404).json({ message: 'Skor tidak ditemukan' });
    res.json(score);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
