// ==========================================
// Apple Worm Adventure - Master Demo Seed Script (Phase 10)
// ==========================================
// Idempotent database provisioner for evaluation, demos, and testing.
// Seeds demo player, demo administrator, game progress, ledger transactions,
// and leaderboard entries without duplicates.

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { connectDB } = require('../config/db');
const {
  User,
  PlayerProgress,
  GameSession,
  LeaderboardEntry,
  RewardTransaction,
  Achievement,
  Level
} = require('../models');

const levelsData = require('../config/levelsData.json');

async function seedDemoData() {
  console.log('========================================================');
  console.log('🍎 APPLE WORM ADVENTURE - DEMO SEED PROVISIONER');
  console.log('========================================================');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Cannot seed demo data: database connection failed.');
    process.exit(1);
  }

  try {
    // ----------------------------------------------------
    // 1. Seed All 50 Game Levels (if not already seeded)
    // ----------------------------------------------------
    console.log(`\n📦 Step 1: Verifying ${levelsData.length} Game Levels...`);
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
    console.log(`✅ All ${levelsData.length} levels verified in MongoDB Atlas.`);

    // ----------------------------------------------------
    // 2. Seed Default Achievements
    // ----------------------------------------------------
    console.log('\n🏆 Step 2: Verifying Default Game Achievements...');
    const defaultAchievements = [
      { slug: 'first_apple', name: 'First Apple', category: 'progression', description: 'Complete your very first puzzle level.', requirements: { type: 'levels_completed', target: 1 }, rewardAmount: 20, badgeIcon: '🍎' },
      { slug: 'getting_started', name: 'Getting Started', category: 'progression', description: 'Complete 5 puzzle levels in the orchard.', requirements: { type: 'levels_completed', target: 5 }, rewardAmount: 30, badgeIcon: '🐛' },
      { slug: 'puzzle_explorer', name: 'Puzzle Explorer', category: 'progression', description: 'Clear 10 levels and conquer the Sunny Orchard world.', requirements: { type: 'levels_completed', target: 10 }, rewardAmount: 50, badgeIcon: '🗺️' },
      { slug: 'halfway_hero', name: 'Halfway Hero', category: 'progression', description: 'Complete 25 distinct puzzle levels.', requirements: { type: 'levels_completed', target: 25 }, rewardAmount: 100, badgeIcon: '🌟' },
      { slug: 'grandmaster', name: 'Apple Worm Grandmaster', category: 'progression', description: 'Conquer all 50 puzzle levels across all five worlds.', requirements: { type: 'levels_completed', target: 50 }, rewardAmount: 250, badgeIcon: '👑' },
      { slug: 'star_collector_bronze', name: 'Star Seeker', category: 'stars', description: 'Earn a total of 15 golden stars.', requirements: { type: 'stars_earned', target: 15 }, rewardAmount: 30, badgeIcon: '⭐' },
      { slug: 'star_collector_silver', name: 'Star Collector', category: 'stars', description: 'Earn a total of 50 golden stars.', requirements: { type: 'stars_earned', target: 50 }, rewardAmount: 75, badgeIcon: '✨' },
      { slug: 'star_collector_gold', name: 'Star Virtuoso', category: 'stars', description: 'Earn 100 golden stars across your journey.', requirements: { type: 'stars_earned', target: 100 }, rewardAmount: 150, badgeIcon: '💫' },
      { slug: 'perfectionist', name: 'Constellation Master', category: 'stars', description: 'Achieve a perfect 3-star rating on all 50 levels (150 stars).', requirements: { type: 'stars_earned', target: 150 }, rewardAmount: 500, badgeIcon: '🌠' },
      { slug: 'point_scorer', name: 'Point Collector', category: 'score', description: 'Accumulate over 5,000 total score across all levels.', requirements: { type: 'total_score', target: 5000 }, rewardAmount: 50, badgeIcon: '🎖️' }
    ];

    for (const ach of defaultAchievements) {
      await Achievement.findOneAndUpdate(
        { slug: ach.slug },
        ach,
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ ${defaultAchievements.length} achievements verified in MongoDB Atlas.`);

    // ----------------------------------------------------
    // 3. Provision Demo Administrator User
    // ----------------------------------------------------
    console.log('\n🛡️ Step 3: Provisioning Demo Administrator Account...');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@appleworm.dev').toLowerCase();
    const adminUsername = process.env.ADMIN_USERNAME || 'AppleAdmin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    const adminSalt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(adminPassword, adminSalt);

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        username: adminUsername,
        email: adminEmail,
        passwordHash: adminHash,
        role: 'admin',
        walletBalance: 500,
        inventory: { extraMoves: 5, smartHints: 5, reviveTokens: 5, doubleScoreBoosts: 5 }
      });
      console.log(`✅ Created Administrator: ${adminUser.username} (${adminUser.email})`);
    } else {
      adminUser.role = 'admin';
      adminUser.passwordHash = adminHash;
      await adminUser.save();
      console.log(`ℹ️ Updated existing Administrator: ${adminUser.username}`);
    }

    // Ensure Admin has linked PlayerProgress
    await PlayerProgress.findOneAndUpdate(
      { user: adminUser._id },
      {
        $setOnInsert: {
          user: adminUser._id,
          unlockedLevels: [1],
          completedLevels: [],
          starsEarned: 0,
          totalScore: 0,
          totalGamesPlayed: 0
        }
      },
      { upsert: true }
    );

    // ----------------------------------------------------
    // 4. Provision Demo Player User
    // ----------------------------------------------------
    console.log('\n🎮 Step 4: Provisioning Demo Player Account & Progress...');
    const playerEmail = 'demo@appleworm.dev';
    const playerUsername = 'DemoPlayer';
    const playerPassword = 'DemoPassword123!';

    const playerSalt = await bcrypt.genSalt(10);
    const playerHash = await bcrypt.hash(playerPassword, playerSalt);

    let demoPlayer = await User.findOne({ email: playerEmail });
    if (!demoPlayer) {
      demoPlayer = await User.create({
        username: playerUsername,
        email: playerEmail,
        passwordHash: playerHash,
        role: 'player',
        walletBalance: 350,
        inventory: { extraMoves: 3, smartHints: 2, reviveTokens: 1, doubleScoreBoosts: 1 }
      });
      console.log(`✅ Created Demo Player: ${demoPlayer.username} (${demoPlayer.email})`);
    } else {
      demoPlayer.passwordHash = playerHash;
      demoPlayer.walletBalance = 350;
      await demoPlayer.save();
      console.log(`ℹ️ Updated existing Demo Player: ${demoPlayer.username}`);
    }

    // Provision Demo Player Progress: 5 levels completed, level 6 unlocked, 14 stars, 6,750 score
    const sampleCompletedLevels = [
      { levelNumber: 1, stars: 3, movesTaken: 8, bestScore: 1420, completedAt: new Date(Date.now() - 3600000 * 48) },
      { levelNumber: 2, stars: 3, movesTaken: 11, bestScore: 1390, completedAt: new Date(Date.now() - 3600000 * 36) },
      { levelNumber: 3, stars: 3, movesTaken: 9, bestScore: 1450, completedAt: new Date(Date.now() - 3600000 * 24) },
      { levelNumber: 4, stars: 2, movesTaken: 15, bestScore: 1150, completedAt: new Date(Date.now() - 3600000 * 12) },
      { levelNumber: 5, stars: 3, movesTaken: 12, bestScore: 1340, completedAt: new Date(Date.now() - 3600000 * 2) }
    ];

    const demoProgress = await PlayerProgress.findOneAndUpdate(
      { user: demoPlayer._id },
      {
        user: demoPlayer._id,
        unlockedLevels: [1, 2, 3, 4, 5, 6],
        completedLevels: sampleCompletedLevels,
        starsEarned: 14,
        totalScore: 6750,
        totalGamesPlayed: 9
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`✅ Demo Player progress configured: 5 levels completed, Level 6 unlocked, 14/150 stars.`);

    // ----------------------------------------------------
    // 5. Provision Sample Game Sessions
    // ----------------------------------------------------
    console.log('\n📜 Step 5: Provisioning Game History & Sessions...');
    await GameSession.deleteMany({ user: demoPlayer._id });
    const sampleSessions = sampleCompletedLevels.map((lvl) => ({
      user: demoPlayer._id,
      level: lvl.levelNumber,
      movesTaken: lvl.movesTaken,
      starsAwarded: lvl.stars,
      score: lvl.bestScore,
      completionStatus: 'completed',
      durationSeconds: Math.floor(Math.random() * 40) + 20,
      createdAt: lvl.completedAt
    }));
    await GameSession.insertMany(sampleSessions);
    console.log(`✅ Inserted ${sampleSessions.length} game sessions for Demo Player.`);

    // ----------------------------------------------------
    // 6. Provision Sample Reward Transactions
    // ----------------------------------------------------
    console.log('\n💰 Step 6: Provisioning Wallet Reward Ledger...');
    await RewardTransaction.deleteMany({ user: demoPlayer._id });
    const sampleTransactions = [
      {
        user: demoPlayer._id,
        transactionType: 'reward_grant',
        rewardSource: 'signup_bonus',
        amount: 200,
        balanceBefore: 0,
        balanceAfter: 200,
        description: 'Welcome to Apple Worm Adventure starting bonus!',
        createdAt: new Date(Date.now() - 3600000 * 48)
      },
      {
        user: demoPlayer._id,
        transactionType: 'reward_grant',
        rewardSource: 'level_complete',
        amount: 50,
        balanceBefore: 200,
        balanceAfter: 250,
        description: 'Level #1 First Clear Reward',
        createdAt: new Date(Date.now() - 3600000 * 40)
      },
      {
        user: demoPlayer._id,
        transactionType: 'reward_grant',
        rewardSource: 'daily_login',
        amount: 25,
        balanceBefore: 250,
        balanceAfter: 275,
        description: 'Daily Check-in Reward',
        createdAt: new Date(Date.now() - 3600000 * 24)
      },
      {
        user: demoPlayer._id,
        transactionType: 'reward_grant',
        rewardSource: 'rewarded_ad',
        amount: 75,
        balanceBefore: 275,
        balanceAfter: 350,
        description: 'Mock Sponsored Ad Bonus (2x Multiplier)',
        createdAt: new Date(Date.now() - 3600000 * 2)
      }
    ];
    await RewardTransaction.insertMany(sampleTransactions);
    console.log(`✅ Seeded ${sampleTransactions.length} sample wallet transactions.`);

    // ----------------------------------------------------
    // 7. Provision Sample Leaderboard Entries
    // ----------------------------------------------------
    console.log('\n🏆 Step 7: Provisioning Leaderboard High Scores...');
    for (const lvl of sampleCompletedLevels) {
      await LeaderboardEntry.findOneAndUpdate(
        { user: demoPlayer._id, level: lvl.levelNumber },
        {
          user: demoPlayer._id,
          username: demoPlayer.username,
          level: lvl.levelNumber,
          score: lvl.bestScore,
          movesTaken: lvl.movesTaken,
          stars: lvl.stars
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ Seeded ${sampleCompletedLevels.length} leaderboard high scores.`);

    console.log('\n========================================================');
    console.log('🎉 DEMO DATA SEEDING COMPLETE!');
    console.log('========================================================');
    console.log('Use these accounts for evaluation and live testing:');
    console.log('');
    console.log('  1. DEMO PLAYER ACCOUNT:');
    console.log(`     Email:    ${playerEmail}`);
    console.log(`     Password: ${playerPassword}`);
    console.log(`     Role:     player (5 levels completed, Level 6 unlocked, 350 Coins)`);
    console.log('');
    console.log('  2. ADMINISTRATOR ACCOUNT:');
    console.log(`     Email:    ${adminEmail}`);
    console.log(`     Password: ${adminPassword}`);
    console.log(`     Role:     admin (full access to /admin economy controls)`);
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during demo data seeding:', err);
    process.exit(1);
  }
}

seedDemoData();

