// ==========================================
// Apple Worm Adventure - Economy Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getEconomyConfig,
  updateEconomyConfig
} = require('../controllers/economyController');

// Public safe economy configuration
router.get('/config', getEconomyConfig);

// Administrative economy configuration update
router.put('/config', protect, requireAdmin, updateEconomyConfig);

module.exports = router;

