// ==========================================
// Apple Worm Adventure - Level Model
// ==========================================

const mongoose = require('mongoose');

// Coordinate sub-schema
const coordinateSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
      min: 0
    },
    y: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

// Obstacle sub-schema
const obstacleSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
      min: 0
    },
    y: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['wall', 'spike', 'block'],
      default: 'wall'
    }
  },
  { _id: false }
);

const levelSchema = new mongoose.Schema(
  {
    levelNumber: {
      type: Number,
      required: [true, 'Level number is required'],
      unique: true,
      min: [1, 'Level number must be at least 1']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    world: {
      type: Number,
      default: 1
    },
    grid: {
      width: {
        type: Number,
        required: [true, 'Grid width is required'],
        min: [3, 'Grid width must be at least 3'],
        default: 8
      },
      height: {
        type: Number,
        required: [true, 'Grid height is required'],
        min: [3, 'Grid height must be at least 3'],
        default: 8
      }
    },
    startingPosition: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Worm starting position is required']
    },
    applePositions: {
      type: [coordinateSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A level must have at least one apple'
      }
    },
    obstacles: {
      type: [obstacleSchema],
      default: []
    },
    portalPosition: {
      type: coordinateSchema,
      required: [true, 'Portal exit position is required']
    },
    maxMoves: {
      type: Number,
      required: [true, 'Maximum allowed moves is required'],
      min: [1, 'Maximum moves must be at least 1']
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard', 'expert'],
        message: '{VALUE} is not a valid difficulty level'
      },
      default: 'easy'
    }
  },
  {
    timestamps: true
  }
);

levelSchema.index({ difficulty: 1 });

const Level = mongoose.model('Level', levelSchema);

module.exports = Level;

