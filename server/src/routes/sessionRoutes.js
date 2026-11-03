// ==========================================
// Apple Worm Adventure - Game Session Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { recordSession, getMySessions } = require('../controllers/sessionController');

// All session routes require JWT authentication
router.use(protect);

router.get('/me', getMySessions);
router.post('/', recordSession);

module.exports = router;

