// ==========================================
// Apple Worm Adventure - Admin Routes (Phase 9)
// ==========================================

const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getAdminPlayers,
  getAdminPlayerById
} = require('../controllers/adminController');
const {
  getEconomyConfig,
  updateEconomyConfig
} = require('../controllers/economyController');

// All routes in this file require valid JWT + Administrator role
router.use(protect, requireAdmin);

// Admin Analytics & Metrics
router.get('/stats', getAdminStats);
router.get('/overview', getAdminStats); // Backward-compatible alias

// Player Management
router.get('/players', getAdminPlayers);
router.get('/players/:id', getAdminPlayerById);

// Economy Management (aliases to /api/economy/config)
router.get('/economy', getEconomyConfig);
router.put('/economy', updateEconomyConfig);

module.exports = router;
