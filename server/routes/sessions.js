const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC']]
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { duration, score } = req.body;
    const session = await Session.create({
      userId: req.userId,
      duration,
      score
    });

    // Batasi riwayat session per user maksimal 10
    const sessions = await Session.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC']]
    });

    if (sessions.length > 10) {
      const idsToDelete = sessions.slice(10).map(s => s.id);
      await Session.destroy({
        where: { id: idsToDelete }
      });
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/high-score', auth, async (req, res) => {
  try {
    const highScore = await Session.max('score', {
      where: { userId: req.userId }
    });
    res.json({ highScore: highScore || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
