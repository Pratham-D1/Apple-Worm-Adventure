// ==========================================
// Apple Worm Adventure - GameSession Model
// ==========================================

const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      required: false,
      index: true
    },
    levelNumber: {
      type: Number,
      required: [true, 'Level number is required'],
      min: 1,
      max: 50
    },
    levelTitle: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      default: 0,
      min: 0
    },
    movesUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    maxMoves: {
      type: Number,
      default: 0
    },
    stars: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    completionStatus: {
      type: String,
      enum: {
        values: ['in_progress', 'completed', 'failed', 'abandoned'],
        message: '{VALUE} is not a valid game session status'
      },
      default: 'in_progress',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly fetch a player's recent game session history
gameSessionSchema.index({ user: 1, createdAt: -1 });
gameSessionSchema.index({ user: 1, completionStatus: 1, createdAt: -1 });

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;
