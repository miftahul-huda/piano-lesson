const express = require('express');
const router = express.Router();

// In-memory store for remote keyboard events
const remoteEvents = {};

/**
 * @swagger
 * /api/remote/press:
 *   post:
 *     summary: Send a piano key press event from a mobile device
 *     tags: [Remote]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, note]
 *             properties:
 *               sessionId:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event received successfully
 */
router.post('/press', (req, res) => {
  const { sessionId, note } = req.body;
  console.log(`[REMOTE] Press: Session=${sessionId}, Note=${note}`);
  if (!sessionId || !note) return res.status(400).json({ message: 'Missing sessionId or note' });
  
  if (!remoteEvents[sessionId]) {
    remoteEvents[sessionId] = [];
  }
  
  remoteEvents[sessionId].push({ note, timestamp: Date.now() });
  
  if (remoteEvents[sessionId].length > 10) {
    remoteEvents[sessionId].shift();
  }
  
  res.json({ success: true });
});

/**
 * @swagger
 * /api/remote/poll/{sessionId}:
 *   get:
 *     summary: Poll for piano key press events for a specific session
 *     tags: [Remote]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of pending events
 */
router.get('/poll/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const events = remoteEvents[sessionId] || [];
  
  // Clear events after polling
  remoteEvents[sessionId] = [];
  
  res.json({ events });
});

module.exports = router;
