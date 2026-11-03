// ==========================================
// Apple Worm Adventure - Economy Controller (Phase 9)
// ==========================================

const { EconomyConfig } = require('../models');

/**
 * @desc    Get safe public economy configuration
 * @route   GET /api/economy/config
 * @access  Public
 */
const getEconomyConfig = async (req, res, next) => {
  try {
    const config = await EconomyConfig.getOrCreateConfig();

    return res.status(200).json({
      success: true,
      config: {
        levelCompleteBaseReward: config.levelCompleteBaseReward,
        starBonusCoins: config.starBonusCoins,
        dailyEarningLimit: config.dailyEarningLimit,
        dailyClaimLimit: config.dailyClaimLimit,
        doubleRewardMultiplier: config.doubleRewardMultiplier,
        mockAdRewardCoins: config.mockAdRewardCoins,
        dailyMockAdLimit: config.dailyMockAdLimit,
        dailyLoginBonus: config.dailyLoginBonus,
        boosterPrices: config.boosterPrices,
        featuresEnabled: config.featuresEnabled,
        mockProviderDetails: config.mockProviderDetails,
        lastUpdatedBy: config.lastUpdatedBy,
        lastUpdatedAt: config.lastUpdatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update economy settings with strict validation and audit (Admin only)
 * @route   PUT /api/economy/config (and alias PUT /api/admin/economy)
 * @access  Private (Admin only)
 */
const updateEconomyConfig = async (req, res, next) => {
  try {
    const config = await EconomyConfig.getOrCreateConfig();
    const updates = req.body;

    // Strict validation rules
    const validationRules = [
      { key: 'levelCompleteBaseReward', label: 'Base level reward', min: 0, max: 1000 },
      { key: 'starBonusCoins', label: 'Star bonus coins', min: 0, max: 500 },
      { key: 'dailyEarningLimit', label: 'Daily earning limit', min: 0, max: 10000 },
      { key: 'dailyClaimLimit', label: 'Daily claim limit', min: 1, max: 100 },
      { key: 'doubleRewardMultiplier', label: 'Double reward multiplier', min: 1, max: 5 },
      { key: 'mockAdRewardCoins', label: 'Mock ad reward coins', min: 0, max: 500 },
      { key: 'dailyMockAdLimit', label: 'Daily mock ad limit', min: 0, max: 50 },
      { key: 'dailyLoginBonus', label: 'Daily login bonus', min: 0, max: 500 }
    ];

    for (const rule of validationRules) {
      if (updates[rule.key] !== undefined) {
        const val = Number(updates[rule.key]);
        if (isNaN(val) || val < rule.min || val > rule.max) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${rule.label}: Value must be a number between ${rule.min} and ${rule.max}`
          });
        }
        config[rule.key] = val;
      }
    }

    // Validate booster prices if provided
    if (updates.boosterPrices && typeof updates.boosterPrices === 'object') {
      const allowedBoosterKeys = ['extra_moves', 'smart_hint', 'revive_token', 'double_score'];
      for (const bKey of allowedBoosterKeys) {
        if (updates.boosterPrices[bKey] !== undefined) {
          const bVal = Number(updates.boosterPrices[bKey]);
          if (isNaN(bVal) || bVal < 0 || bVal > 2000) {
            return res.status(400).json({
              success: false,
              message: `Invalid booster price for "${bKey}": Price must be between 0 and 2000 coins`
            });
          }
          config.boosterPrices[bKey] = bVal;
        }
      }
    }

    // Validate feature toggles if provided
    if (updates.featuresEnabled && typeof updates.featuresEnabled === 'object') {
      const allowedFeatureKeys = ['levelRewards', 'doubleRewards', 'dailyBonus', 'mockAds', 'boosterStore'];
      allowedFeatureKeys.forEach((fKey) => {
        if (typeof updates.featuresEnabled[fKey] === 'boolean') {
          config.featuresEnabled[fKey] = updates.featuresEnabled[fKey];
        }
      });
    }

    // Audit tracking: record which administrator modified configuration
    config.lastUpdatedBy = req.user ? req.user._id : null;
    config.lastUpdatedAt = new Date();

    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Economy configuration updated successfully',
      config: {
        levelCompleteBaseReward: config.levelCompleteBaseReward,
        starBonusCoins: config.starBonusCoins,
        dailyEarningLimit: config.dailyEarningLimit,
        dailyClaimLimit: config.dailyClaimLimit,
        doubleRewardMultiplier: config.doubleRewardMultiplier,
        mockAdRewardCoins: config.mockAdRewardCoins,
        dailyMockAdLimit: config.dailyMockAdLimit,
        dailyLoginBonus: config.dailyLoginBonus,
        boosterPrices: config.boosterPrices,
        featuresEnabled: config.featuresEnabled,
        lastUpdatedBy: config.lastUpdatedBy,
        lastUpdatedAt: config.lastUpdatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEconomyConfig,
  updateEconomyConfig
};
