// ==========================================
// Apple Worm Adventure - Wallet Controller
// ==========================================

const { User, RewardTransaction, EconomyConfig } = require('../models');

const BOOSTER_INFO = {
  extra_moves: { title: 'Extra Moves (+5)', inventoryKey: 'extraMoves' },
  smart_hint: { title: 'Smart Apple Hint', inventoryKey: 'smartHints' },
  revive_token: { title: 'Revive Token', inventoryKey: 'reviveTokens' },
  double_score: { title: 'Double Score Boost', inventoryKey: 'doubleScoreBoosts' }
};

/**
 * @desc    Get current authenticated player's wallet balance, totals, and daily limits
 * @route   GET /api/wallet/me
 * @access  Private (JWT)
 */
const getMyWallet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('username email walletBalance inventory');
    const config = await EconomyConfig.getOrCreateConfig();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Aggregate lifetime earnings and spending
    const [lifetimeStats] = await RewardTransaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: { $cond: [{ $gt: ['$coinAmount', 0] }, '$coinAmount', 0] }
          },
          totalSpent: {
            $sum: { $cond: [{ $lt: ['$coinAmount', 0] }, { $abs: '$coinAmount' }, 0] }
          }
        }
      }
    ]);

    // Aggregate today's earnings
    const [todayStats] = await RewardTransaction.aggregate([
      {
        $match: {
          user: userId,
          coinAmount: { $gt: 0 },
          createdAt: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          earnedToday: { $sum: '$coinAmount' }
        }
      }
    ]);

    // Check if daily bonus was claimed today
    const dailyBonusTx = await RewardTransaction.findOne({
      user: userId,
      rewardSource: 'daily_bonus',
      createdAt: { $gte: startOfToday }
    });

    // Count mock ads watched today
    const mockAdsWatchedToday = await RewardTransaction.countDocuments({
      user: userId,
      rewardSource: 'mock_ad_view',
      createdAt: { $gte: startOfToday }
    });

    const totalEarned = lifetimeStats?.totalEarned || 0;
    const totalSpent = lifetimeStats?.totalSpent || 0;
    const earnedToday = todayStats?.earnedToday || 0;
    const dailyEarningLimit = config.dailyEarningLimit;
    const dailyRemaining = Math.max(0, dailyEarningLimit - earnedToday);
    const mockAdsRemaining = Math.max(0, config.dailyMockAdLimit - mockAdsWatchedToday);

    return res.status(200).json({
      success: true,
      wallet: {
        userId: user._id,
        username: user.username,
        walletBalance: user.walletBalance,
        totalEarned,
        totalSpent,
        earnedToday,
        dailyEarningLimit,
        dailyRemaining,
        inventory: user.inventory || {
          extraMoves: 0,
          smartHints: 0,
          reviveTokens: 0,
          doubleScoreBoosts: 0
        },
        dailyBonus: {
          amount: config.dailyLoginBonus,
          available: !dailyBonusTx && config.featuresEnabled.dailyBonus
        },
        mockAd: {
          amount: config.mockAdRewardCoins,
          dailyLimit: config.dailyMockAdLimit,
          watchedToday: mockAdsWatchedToday,
          remainingToday: mockAdsRemaining,
          available: mockAdsRemaining > 0 && dailyRemaining > 0 && config.featuresEnabled.mockAds,
          provider: config.mockProviderDetails
        },
        boosterPrices: config.boosterPrices
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current player's reward transaction ledger history
 * @route   GET /api/wallet/transactions
 * @access  Private (JWT)
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;

    const query = { user: userId };
    if (req.query.type) {
      query.transactionType = req.query.type;
    }

    const [total, transactions] = await Promise.all([
      RewardTransaction.countDocuments(query),
      RewardTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      totalCount: total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.transactionType,
        amount: t.coinAmount,
        balanceAfter: t.balanceAfter,
        reason: t.reason,
        source: t.rewardSource,
        levelNumber: t.levelNumber,
        idempotencyKey: t.idempotencyKey,
        date: t.createdAt,
        metadata: t.metadata
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purchase in-game booster using wallet balance
 * @route   POST /api/wallet/spend
 * @access  Private (JWT)
 */
const spendCoins = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId, idempotencyKey } = req.body;

    // 1. Validate Item ID
    const boosterMeta = BOOSTER_INFO[itemId];
    if (!boosterMeta) {
      return res.status(400).json({
        success: false,
        message: `Invalid booster item: '${itemId}'. Available items: ${Object.keys(BOOSTER_INFO).join(', ')}`
      });
    }

    // 2. Fetch centralized price from EconomyConfig
    const config = await EconomyConfig.getOrCreateConfig();
    if (!config.featuresEnabled.boosterStore) {
      return res.status(403).json({
        success: false,
        message: 'The booster store is currently disabled by game economy administration.'
      });
    }

    const cost = config.boosterPrices[itemId];
    if (typeof cost !== 'number' || cost <= 0) {
      return res.status(400).json({
        success: false,
        message: `Price configuration missing for booster: ${itemId}`
      });
    }

    // 3. Idempotency Check: Prevent duplicate deductions
    const key = idempotencyKey || `spend_${userId}_${itemId}_${Date.now()}`;
    const existingTx = await RewardTransaction.findOne({ idempotencyKey: key });
    if (existingTx) {
      const curUser = await User.findById(userId).select('walletBalance inventory');
      return res.status(200).json({
        success: true,
        message: `Request already processed (idempotency verified).`,
        itemId,
        cost,
        newBalance: curUser.walletBalance,
        inventory: curUser.inventory,
        transaction: existingTx
      });
    }

    // 4. Atomic Balance Check & Deduction (ensures balance >= cost and never drops below zero)
    const inventoryKey = boosterMeta.inventoryKey;
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: cost } },
      {
        $inc: {
          walletBalance: -cost,
          [`inventory.${inventoryKey}`]: 1
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      const currentUser = await User.findById(userId).select('walletBalance');
      const currentBalance = currentUser ? currentUser.walletBalance : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. '${boosterMeta.title}' costs ${cost} coins, but your balance is ${currentBalance} coins.`,
        required: cost,
        currentBalance
      });
    }

    // 5. Create Ledger Entry
    const transaction = await RewardTransaction.create({
      user: userId,
      transactionType: 'spending',
      coinAmount: -cost,
      balanceAfter: updatedUser.walletBalance,
      reason: `Purchased booster: ${boosterMeta.title}`,
      rewardSource: 'booster_purchase',
      idempotencyKey: key,
      metadata: {
        itemId,
        itemTitle: boosterMeta.title,
        cost,
        newInventoryCount: updatedUser.inventory[inventoryKey]
      }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully purchased ${boosterMeta.title}!`,
      itemId,
      cost,
      newBalance: updatedUser.walletBalance,
      inventory: updatedUser.inventory,
      transaction: {
        id: transaction._id,
        amount: transaction.coinAmount,
        balanceAfter: transaction.balanceAfter,
        reason: transaction.reason,
        date: transaction.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWallet,
  getMyTransactions,
  spendCoins
};

