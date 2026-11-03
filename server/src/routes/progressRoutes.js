// ==========================================
// Apple Worm Adventure - Progress Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyProgress, getLevelsProgress } = require('../controllers/progressController');

// All progress routes require JWT authentication
router.use(protect);

router.get('/me', getMyProgress);
router.get('/levels', getLevelsProgress);

module.exports = router;

