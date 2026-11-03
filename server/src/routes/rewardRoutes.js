// ==========================================
// Apple Worm Adventure - Reward Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  claimReward,
  claimDoubleReward
} = require('../controllers/rewardController');

// All reward routes require player authentication
router.use(protect);

router.post('/claim', claimReward);
router.post('/double', claimDoubleReward);

module.exports = router;

