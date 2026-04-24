const express = require('express');
const router = express.Router();

// In-memory store for remote keyboard events
const remoteEvents = {};

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

router.get('/poll/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const events = remoteEvents[sessionId] || [];
  
  // Clear events after polling
  remoteEvents[sessionId] = [];
  
  res.json({ events });
});

module.exports = router;
