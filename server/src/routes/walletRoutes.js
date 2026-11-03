// ==========================================
// Apple Worm Adventure - Wallet Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyWallet,
  getMyTransactions,
  spendCoins
} = require('../controllers/walletController');

// All wallet routes require player authentication
router.use(protect);

router.get('/me', getMyWallet);
router.get('/transactions', getMyTransactions);
router.post('/spend', spendCoins);

module.exports = router;

