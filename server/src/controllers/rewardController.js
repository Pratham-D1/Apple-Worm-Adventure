// ==========================================
// Apple Worm Adventure - Reward Controller
// ==========================================

const { User, RewardTransaction, GameSession, EconomyConfig } = require('../models');

/**
 * @desc    Claim eligible daily bonus or simulated ad reward
 * @route   POST /api/rewards/claim
 * @access  Private (JWT)
 */
const claimReward = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { claimType, idempotencyKey } = req.body;

    const config = await EconomyConfig.getOrCreateConfig();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Calculate current earnings today
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
    const earnedToday = todayStats?.earnedToday || 0;
    const dailyCap = config.dailyEarningLimit;
    const capRemaining = Math.max(0, dailyCap - earnedToday);

    // ------------------------------------------
    // 1. Daily Login Bonus Claim
    // ------------------------------------------
    if (claimType === 'daily_bonus') {
      if (!config.featuresEnabled.dailyBonus) {
        return res.status(403).json({
          success: false,
          message: 'Daily bonus feature is currently disabled.'
        });
      }

      // Check if already claimed today
      const alreadyClaimed = await RewardTransaction.findOne({
        user: userId,
        rewardSource: 'daily_bonus',
        createdAt: { $gte: startOfToday }
      });

      if (alreadyClaimed) {
        return res.status(409).json({
          success: false,
          message: 'Daily bonus has already been claimed today. Please check back tomorrow!'
        });
      }

      const rewardAmount = Math.min(config.dailyLoginBonus, capRemaining);
      if (rewardAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Daily earning cap has been reached for today.'
        });
      }

      const key = idempotencyKey || `daily_${userId}_${startOfToday.toISOString().split('T')[0]}`;
      const existingTx = await RewardTransaction.findOne({ idempotencyKey: key });
      if (existingTx) {
        const u = await User.findById(userId).select('walletBalance');
        return res.status(200).json({
          success: true,
          message: 'Daily bonus already processed.',
          coinsAwarded: existingTx.coinAmount,
          newBalance: u.walletBalance
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: rewardAmount } },
        { returnDocument: 'after' }
      );

      const tx = await RewardTransaction.create({
        user: userId,
        transactionType: 'bonus',
        coinAmount: rewardAmount,
        balanceAfter: updatedUser.walletBalance,
        reason: 'Claimed daily player login bonus',
        rewardSource: 'daily_bonus',
        idempotencyKey: key,
        metadata: {
          standardBonus: config.dailyLoginBonus,
          capRemainingBefore: capRemaining
        }
      });

      return res.status(200).json({
        success: true,
        message: `Claimed ${rewardAmount} daily bonus coins!`,
        coinsAwarded: rewardAmount,
        newBalance: updatedUser.walletBalance,
        transaction: tx
      });
    }

    // ------------------------------------------
    // 2. Simulated Rewarded-Ad Bonus (Mock Provider)
    // ------------------------------------------
    if (claimType === 'mock_ad') {
      if (!config.featuresEnabled.mockAds) {
        return res.status(403).json({
          success: false,
          message: 'Simulated rewarded ads are currently disabled.'
        });
      }

      // Count claims today
      const mockAdsCount = await RewardTransaction.countDocuments({
        user: userId,
        rewardSource: 'mock_ad_view',
        createdAt: { $gte: startOfToday }
      });

      if (mockAdsCount >= config.dailyMockAdLimit) {
        return res.status(429).json({
          success: false,
          message: `Daily simulated ad limit reached (${config.dailyMockAdLimit}/${config.dailyMockAdLimit}). Limit resets at midnight.`
        });
      }

      const rewardAmount = Math.min(config.mockAdRewardCoins, capRemaining);
      if (rewardAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Daily earning cap has been reached for today.'
        });
      }

      const key = idempotencyKey || `mock_ad_${userId}_${Date.now()}`;
      const existingTx = await RewardTransaction.findOne({ idempotencyKey: key });
      if (existingTx) {
        const u = await User.findById(userId).select('walletBalance');
        return res.status(200).json({
          success: true,
          message: 'Simulated ad reward already credited.',
          coinsAwarded: existingTx.coinAmount,
          newBalance: u.walletBalance
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: rewardAmount } },
        { returnDocument: 'after' }
      );

      const tx = await RewardTransaction.create({
        user: userId,
        transactionType: 'bonus',
        coinAmount: rewardAmount,
        balanceAfter: updatedUser.walletBalance,
        reason: 'Simulated rewarded-ad view reward',
        rewardSource: 'mock_ad_view',
        idempotencyKey: key,
        metadata: {
          isSimulation: true,
          provider: config.mockProviderDetails.providerName,
          viewsToday: mockAdsCount + 1,
          dailyLimit: config.dailyMockAdLimit
        }
      });

      return res.status(200).json({
        success: true,
        message: `Claimed ${rewardAmount} coins from demo rewarded ad!`,
        coinsAwarded: rewardAmount,
        newBalance: updatedUser.walletBalance,
        mockAdsRemainingToday: Math.max(0, config.dailyMockAdLimit - (mockAdsCount + 1)),
        isSimulation: true,
        transaction: tx
      });
    }

    // ------------------------------------------
    // 3. Simulated Ad for Free Booster (+5 Extra Moves)
    // ------------------------------------------
    if (claimType === 'mock_ad_moves') {
      const mockAdsCount = await RewardTransaction.countDocuments({
        user: userId,
        rewardSource: 'mock_ad_moves',
        createdAt: { $gte: startOfToday }
      });

      if (mockAdsCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Daily limit for free moves reached (3/3).'
        });
      }

      const key = idempotencyKey || `ad_moves_${userId}_${Date.now()}`;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { 'inventory.extraMoves': 1 } },
        { returnDocument: 'after' }
      );

      const tx = await RewardTransaction.create({
        user: userId,
        transactionType: 'adjustment',
        coinAmount: 1, // Non-zero requirement
        balanceAfter: updatedUser.walletBalance,
        reason: 'Simulated rewarded ad: +1 Extra Moves booster',
        rewardSource: 'mock_ad_moves',
        idempotencyKey: key,
        metadata: { isSimulation: true, boosterGranted: 'extraMoves' }
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully claimed +1 Extra Moves booster via demo ad!',
        inventory: updatedUser.inventory,
        newBalance: updatedUser.walletBalance
      });
    }

    return res.status(400).json({
      success: false,
      message: `Invalid claimType: '${claimType}'. Supported: 'daily_bonus', 'mock_ad', 'mock_ad_moves'`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Claim double coins for an eligible level completion session
 * @route   POST /api/rewards/double
 * @access  Private (JWT)
 */
const claimDoubleReward = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId, idempotencyKey } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required to claim double reward'
      });
    }

    const config = await EconomyConfig.getOrCreateConfig();
    if (!config.featuresEnabled.doubleRewards) {
      return res.status(403).json({
        success: false,
        message: 'Double rewards feature is currently disabled.'
      });
    }

    // 1. Verify session exists, belongs to this player, and was completed
    const session = await GameSession.findOne({
      _id: sessionId,
      user: userId,
      completionStatus: 'completed'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Eligible completed game session not found.'
      });
    }

    // 2. Check if double reward was already claimed for this session
    const alreadyDoubled = await RewardTransaction.findOne({
      user: userId,
      rewardSource: 'double_reward',
      relatedSession: sessionId
    });

    if (alreadyDoubled) {
      return res.status(409).json({
        success: false,
        message: 'Double reward has already been claimed for this level session.'
      });
    }

    // 3. Find original level completion reward transaction
    const originalTx = await RewardTransaction.findOne({
      user: userId,
      rewardSource: 'level_complete',
      relatedSession: sessionId
    });

    if (!originalTx || originalTx.coinAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Session was not awarded completion coins (or daily cap was previously reached).'
      });
    }

    // 4. Calculate bonus coins based on double multiplier
    const originalAmount = originalTx.coinAmount;
    const multiplier = config.doubleRewardMultiplier || 2;
    const potentialBonus = originalAmount * (multiplier - 1);

    // 5. Apply daily earning cap
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

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
    const earnedToday = todayStats?.earnedToday || 0;
    const capRemaining = Math.max(0, config.dailyEarningLimit - earnedToday);
    const finalBonus = Math.min(potentialBonus, capRemaining);

    if (finalBonus <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Daily earning cap has been reached. Cannot award additional double bonus coins.'
      });
    }

    // 6. Idempotency Check
    const key = idempotencyKey || `double_${userId}_sess_${sessionId}`;
    const existingTx = await RewardTransaction.findOne({ idempotencyKey: key });
    if (existingTx) {
      const u = await User.findById(userId).select('walletBalance');
      return res.status(200).json({
        success: true,
        message: 'Double reward already processed.',
        bonusCoins: existingTx.coinAmount,
        newBalance: u.walletBalance
      });
    }

    // 7. Atomic Credit & Ledger Entry
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: finalBonus } },
      { returnDocument: 'after' }
    );

    const tx = await RewardTransaction.create({
      user: userId,
      transactionType: 'bonus',
      coinAmount: finalBonus,
      balanceAfter: updatedUser.walletBalance,
      reason: `Double Reward bonus for Level ${session.levelNumber} (${session.levelTitle})`,
      rewardSource: 'double_reward',
      relatedSession: sessionId,
      levelNumber: session.levelNumber,
      idempotencyKey: key,
      metadata: {
        originalAmount,
        multiplier,
        potentialBonus,
        isSimulation: true,
        provider: config.mockProviderDetails.providerName
      }
    });

    return res.status(200).json({
      success: true,
      message: `2x Double Reward applied! Earned +${finalBonus} bonus coins.`,
      bonusCoins: finalBonus,
      newBalance: updatedUser.walletBalance,
      transaction: tx
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  claimReward,
  claimDoubleReward
};

