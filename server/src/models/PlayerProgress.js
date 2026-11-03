// ==========================================
// Apple Worm Adventure - PlayerProgress Model
// ==========================================

const mongoose = require('mongoose');

const levelScoreSchema = new mongoose.Schema(
  {
    levelNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 50
    },
    highScore: {
      type: Number,
      default: 0,
      min: 0
    },
    stars: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    leastMoves: {
      type: Number,
      default: null
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const playerAchievementSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    badgeIcon: {
      type: String,
      default: '🏆'
    },
    rewardAmount: {
      type: Number,
      default: 0
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const playerProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    unlockedLevels: {
      type: [Number],
      default: [1] // Level 1 is unlocked by default
    },
    completedLevels: {
      type: [Number],
      default: []
    },
    starsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0
    },
    totalGamesPlayed: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPlayedLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 50
    },
    bestScores: {
      type: [levelScoreSchema],
      default: []
    },
    achievements: {
      type: [playerAchievementSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/**
 * Helper method to recalculate aggregate statistics consistently
 */
playerProgressSchema.methods.recalculateAggregates = function () {
  this.starsEarned = this.bestScores.reduce((sum, item) => sum + (item.stars || 0), 0);
  this.totalScore = this.bestScores.reduce((sum, item) => sum + (item.highScore || 0), 0);
  
  // Ensure completedLevels contains unique sorted numbers
  const completedSet = new Set(this.completedLevels);
  this.bestScores.forEach((b) => {
    if (b.stars > 0 || b.highScore > 0) {
      completedSet.add(b.levelNumber);
    }
  });
  this.completedLevels = Array.from(completedSet).sort((a, b) => a - b);

  // Ensure unlockedLevels contains unique sorted numbers including at least Level 1
  const unlockedSet = new Set(this.unlockedLevels);
  unlockedSet.add(1);
  this.completedLevels.forEach((lvl) => {
    if (lvl + 1 <= 50) {
      unlockedSet.add(lvl + 1);
    }
  });
  this.unlockedLevels = Array.from(unlockedSet).sort((a, b) => a - b);
};

const PlayerProgress = mongoose.model('PlayerProgress', playerProgressSchema);

module.exports = PlayerProgress;
