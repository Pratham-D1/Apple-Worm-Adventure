// ==========================================
// Apple Worm Adventure - Achievement Routes (Phase 9)
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllAchievements,
  getMyAchievements
} = require('../controllers/achievementController');

// Public route to view all available achievements
router.get('/', getAllAchievements);

// Protected route to view player's own unlocked achievements & progress
router.get('/me', protect, getMyAchievements);

module.exports = router;

