// ==========================================
// Apple Worm Adventure - RewardTransaction Model (Ledger)
// ==========================================

const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    transactionType: {
      type: String,
      enum: {
        values: ['earning', 'spending', 'bonus', 'adjustment', 'reward', 'spend', 'claim'],
        message: '{VALUE} is not a valid transaction type'
      },
      required: [true, 'Transaction type is required'],
      index: true
    },
    coinAmount: {
      type: Number,
      required: [true, 'Coin amount is required'],
      validate: {
        validator: function (v) {
          return typeof v === 'number' && v !== 0;
        },
        message: 'Coin amount cannot be zero'
      }
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Post-transaction balance is required for ledger audit integrity'],
      min: [0, 'Balance after transaction cannot be negative']
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    rewardSource: {
      type: String,
      trim: true,
      default: 'level_complete',
      index: true
    },
    relatedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameSession',
      default: null
    },
    levelNumber: {
      type: Number,
      default: null
    },
    idempotencyKey: {
      type: String,
      required: [true, 'Unique idempotency key is required to prevent double-spending or duplicate rewards'],
      unique: true,
      trim: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for audit trails, user ledger, and daily cap queries
rewardTransactionSchema.index({ user: 1, createdAt: -1 });
rewardTransactionSchema.index({ user: 1, rewardSource: 1, createdAt: -1 });

const RewardTransaction = mongoose.model('RewardTransaction', rewardTransactionSchema);

module.exports = RewardTransaction;
