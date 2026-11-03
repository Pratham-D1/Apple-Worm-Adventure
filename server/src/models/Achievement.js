// ==========================================
// Apple Worm Adventure - Achievement Model
// ==========================================

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Achievement slug is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: [true, 'Achievement name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['progression', 'mastery', 'wealth', 'special'],
      default: 'progression'
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
      trim: true
    },
    requirements: {
      type: {
        type: String,
        required: [true, 'Requirement type is required (e.g., levels_completed, stars_collected, apples_eaten)'],
        trim: true
      },
      target: {
        type: Number,
        required: [true, 'Target numeric threshold is required'],
        min: 1
      }
    },
    rewardAmount: {
      type: Number,
      required: [true, 'Coin reward amount is required'],
      default: 10,
      min: [0, 'Reward amount cannot be negative']
    },
    badgeIcon: {
      type: String,
      default: '🏆'
    }
  },
  {
    timestamps: true
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;

