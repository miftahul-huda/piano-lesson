const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         duration:
 *           type: integer
 *         score:
 *           type: integer
 *         date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions for the authenticated user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 */
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

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Save a new practice session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duration, score]
 *             properties:
 *               duration:
 *                 type: integer
 *               score:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Session saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 */
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
      // Cari session dengan skor tertinggi untuk dipertahankan
      const maxScoreSession = sessions.reduce((prev, current) => {
        return (prev.score > current.score) ? prev : current;
      });

      // Hapus session lama (di luar 10 terbaru), tapi jangan hapus session skor tertinggi
      const idsToDelete = sessions.slice(10)
        .filter(s => s.id !== maxScoreSession.id)
        .map(s => s.id);

      if (idsToDelete.length > 0) {
        await Session.destroy({
          where: { id: idsToDelete }
        });
      }
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/sessions/high-score:
 *   get:
 *     summary: Get the high score for the authenticated user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: High score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 highScore:
 *                   type: integer
 */
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
