// ==========================================
// Apple Worm Adventure - Leaderboard Routes (Phase 9)
// ==========================================

const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');

// Public route to view the global or level-specific leaderboard
router.get('/', getLeaderboard);

module.exports = router;

