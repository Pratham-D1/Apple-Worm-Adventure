// ==========================================
// Apple Worm Adventure - Seed 50 Levels to MongoDB Atlas
// ==========================================

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const { Level } = require('../models');
const levelsData = require('./levelsData.json');

const seedLevels = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.error('❌ MONGODB_URI not configured. Cannot seed levels.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas for level seeding...');
    await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'apple_worm_adventure',
      serverSelectionTimeoutMS: 8000
    });

    console.log(`📦 Connected. Seeding ${levelsData.length} puzzle levels...`);

    for (const lvl of levelsData) {
      await Level.findOneAndUpdate(
        { levelNumber: lvl.levelNumber },
        {
          levelNumber: lvl.levelNumber,
          title: lvl.title,
          world: lvl.world,
          grid: lvl.grid,
          startingPosition: lvl.startingPosition,
          applePositions: lvl.applePositions,
          obstacles: lvl.obstacles,
          portalPosition: lvl.portalPosition,
          maxMoves: lvl.maxMoves,
          difficulty: lvl.difficulty.toLowerCase()
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    console.log(`✅ All ${levelsData.length} levels successfully seeded into MongoDB Atlas!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding levels:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedLevels();
}

module.exports = seedLevels;
