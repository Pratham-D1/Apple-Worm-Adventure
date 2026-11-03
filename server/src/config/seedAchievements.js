// ==========================================
// Apple Worm Adventure - Seed Achievements Script
// ==========================================

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { connectDB } = require('./db');
const { Achievement } = require('../models');

const DEFAULT_ACHIEVEMENTS = [
  {
    slug: 'first_apple',
    name: 'First Apple',
    category: 'progression',
    description: 'Complete your very first puzzle level.',
    requirements: { type: 'levels_completed', target: 1 },
    rewardAmount: 20,
    badgeIcon: '🍎'
  },
  {
    slug: 'getting_started',
    name: 'Getting Started',
    category: 'progression',
    description: 'Complete 5 puzzle levels in the orchard.',
    requirements: { type: 'levels_completed', target: 5 },
    rewardAmount: 30,
    badgeIcon: '🐛'
  },
  {
    slug: 'puzzle_explorer',
    name: 'Puzzle Explorer',
    category: 'progression',
    description: 'Clear 10 levels and conquer the Sunny Orchard world.',
    requirements: { type: 'levels_completed', target: 10 },
    rewardAmount: 50,
    badgeIcon: '🗺️'
  },
  {
    slug: 'halfway_hero',
    name: 'Halfway Hero',
    category: 'progression',
    description: 'Complete 25 distinct puzzle levels.',
    requirements: { type: 'levels_completed', target: 25 },
    rewardAmount: 100,
    badgeIcon: '🌟'
  },
  {
    slug: 'master_player',
    name: 'Master Player',
    category: 'progression',
    description: 'Conquer all 50 challenging puzzle levels in Apple Worm Adventure!',
    requirements: { type: 'levels_completed', target: 50 },
    rewardAmount: 250,
    badgeIcon: '👑'
  },
  {
    slug: 'perfect_run',
    name: 'Perfect Run',
    category: 'mastery',
    description: 'Achieve a flawless 3-star victory on any level.',
    requirements: { type: 'three_star_levels', target: 1 },
    rewardAmount: 25,
    badgeIcon: '🎯'
  },
  {
    slug: 'star_collector',
    name: 'Star Collector',
    category: 'mastery',
    description: 'Gather 30 total golden stars across your puzzle journey.',
    requirements: { type: 'stars_collected', target: 30 },
    rewardAmount: 60,
    badgeIcon: '⭐'
  },
  {
    slug: 'star_master',
    name: 'Star Master',
    category: 'mastery',
    description: 'Gather 75 total golden stars.',
    requirements: { type: 'stars_collected', target: 75 },
    rewardAmount: 150,
    badgeIcon: '🌠'
  },
  {
    slug: 'constellation_legend',
    name: 'Constellation Legend',
    category: 'mastery',
    description: 'Achieve the ultimate feat: earn all 150 possible stars!',
    requirements: { type: 'stars_collected', target: 150 },
    rewardAmount: 500,
    badgeIcon: '🌌'
  },
  {
    slug: 'coin_hoarder',
    name: 'Coin Hoarder',
    category: 'wealth',
    description: 'Accumulate 200 or more VELoop coins in your active wallet balance.',
    requirements: { type: 'wallet_coins', target: 200 },
    rewardAmount: 50,
    badgeIcon: '🪙'
  }
];

const seedAchievements = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas for achievements seeding...');
    await connectDB();

    console.log('📦 Upserting standard achievement blueprints...');
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await Achievement.findOneAndUpdate(
        { slug: ach.slug },
        { $set: ach },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const total = await Achievement.countDocuments();
    console.log(`✅ All ${total} achievements successfully seeded into MongoDB Atlas!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed achievements:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAchievements();
}

module.exports = { seedAchievements, DEFAULT_ACHIEVEMENTS };

