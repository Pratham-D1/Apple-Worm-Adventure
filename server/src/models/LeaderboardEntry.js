// ==========================================
// Apple Worm Adventure - LeaderboardEntry Model
// ==========================================

const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative']
    },
    level: {
      type: Number,
      required: [true, 'Level number is required'],
      min: [1, 'Level number must be at least 1']
    },
    movesUsed: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Unique index: one high-score record per user per level
leaderboardEntrySchema.index({ user: 1, level: 1 }, { unique: true });

// Compound index for high performance leaderboard sorting (level filter, highest score first)
leaderboardEntrySchema.index({ level: 1, score: -1, createdAt: 1 });

const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);

module.exports = LeaderboardEntry;

