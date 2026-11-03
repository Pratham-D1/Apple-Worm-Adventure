// ==========================================
// Apple Worm Adventure - Level Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getLevelsProgress } = require('../controllers/progressController');

// Level progress route requires JWT authentication
router.get('/progress', protect, getLevelsProgress);

module.exports = router;

