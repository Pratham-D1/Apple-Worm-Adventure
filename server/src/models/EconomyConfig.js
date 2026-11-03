// ==========================================
// Apple Worm Adventure - Centralized EconomyConfig Model
// ==========================================

const mongoose = require('mongoose');

const boosterPricesSchema = new mongoose.Schema(
  {
    extra_moves: { type: Number, default: 40, min: 0 },
    smart_hint: { type: Number, default: 60, min: 0 },
    revive_token: { type: Number, default: 50, min: 0 },
    double_score: { type: Number, default: 80, min: 0 }
  },
  { _id: false }
);

const featuresEnabledSchema = new mongoose.Schema(
  {
    levelRewards: { type: Boolean, default: true },
    doubleRewards: { type: Boolean, default: true },
    dailyBonus: { type: Boolean, default: true },
    mockAds: { type: Boolean, default: true },
    boosterStore: { type: Boolean, default: true }
  },
  { _id: false }
);

const economyConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: 'global_economy',
      unique: true,
      trim: true
    },
    displayName: {
      type: String,
      default: 'VELoop Global Game Economy'
    },
    // Base coins awarded for clearing a level
    levelCompleteBaseReward: {
      type: Number,
      default: 50,
      min: [0, 'Base reward cannot be negative']
    },
    // Performance bonus per star earned (e.g. 10 * stars)
    starBonusCoins: {
      type: Number,
      default: 10,
      min: [0, 'Star bonus coins cannot be negative']
    },
    // Daily maximum coins a player can earn from level completion & bonuses
    dailyEarningLimit: {
      type: Number,
      default: 500,
      min: [0, 'Daily earning limit cannot be negative']
    },
    // Daily claim cap on special reward actions
    dailyClaimLimit: {
      type: Number,
      default: 10,
      min: 1
    },
    // Multiplier for double reward action
    doubleRewardMultiplier: {
      type: Number,
      default: 2,
      min: 1,
      max: 5
    },
    // Coins awarded per simulated demo rewarded ad view
    mockAdRewardCoins: {
      type: Number,
      default: 30,
      min: 0
    },
    // Maximum simulated ad claims permitted per day
    dailyMockAdLimit: {
      type: Number,
      default: 5,
      min: 0
    },
    // Daily check-in / login bonus
    dailyLoginBonus: {
      type: Number,
      default: 25,
      min: 0
    },
    // Prices for available in-game boosters
    boosterPrices: {
      type: boosterPricesSchema,
      default: () => ({
        extra_moves: 40,
        smart_hint: 60,
        revive_token: 50,
        double_score: 80
      })
    },
    // Feature toggles
    featuresEnabled: {
      type: featuresEnabledSchema,
      default: () => ({
        levelRewards: true,
        doubleRewards: true,
        dailyBonus: true,
        mockAds: true,
        boosterStore: true
      })
    },
    // Provider independence & mock advertisement details
    mockProviderDetails: {
      providerName: { type: String, default: 'VELoop Demo Ad Simulator' },
      isSimulated: { type: Boolean, default: true },
      notice: {
        type: String,
        default: 'Simulated Ad Experience for evaluation and testing. No real ads are fetched or tracked.'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastUpdatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * Singleton retrieval: Returns global economy configuration document, creating it with defaults if not present
 */
economyConfigSchema.statics.getOrCreateConfig = async function () {
  let config = await this.findOne({ configKey: 'global_economy' });
  if (!config) {
    config = await this.create({
      configKey: 'global_economy',
      displayName: 'VELoop Global Game Economy',
      levelCompleteBaseReward: 50,
      starBonusCoins: 10,
      dailyEarningLimit: 500,
      dailyClaimLimit: 10,
      doubleRewardMultiplier: 2,
      mockAdRewardCoins: 30,
      dailyMockAdLimit: 5,
      dailyLoginBonus: 25
    });
  }
  return config;
};

const EconomyConfig = mongoose.model('EconomyConfig', economyConfigSchema);

module.exports = EconomyConfig;
