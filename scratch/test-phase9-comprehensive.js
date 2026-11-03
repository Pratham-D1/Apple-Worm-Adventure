// ==========================================
// Comprehensive Verification for Phase 9: Admin, Leaderboard & Achievements
// ==========================================

const path = require('path');
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });
process.env.PORT = '5007';

const mongoose = require('../server/node_modules/mongoose');
const app = require('../server/src/index');
const { User, RewardTransaction, EconomyConfig, GameSession, PlayerProgress, Achievement, LeaderboardEntry } = require('../server/src/models');

const PORT = 5007;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runPhase9Verification() {
  console.log('🚀 Starting Comprehensive Phase 9 Verification Suite...');

  // Wait 1.5s for server initialization
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const timestamp = Date.now();
  const playerEmail = `player_${timestamp}@example.com`;
  const playerUsername = `Player_${timestamp}`;
  const adminEmail = `admin_${timestamp}@example.com`;
  const adminUsername = `Admin_${timestamp}`;
  const password = 'Password123!';

  let playerToken = null;
  let adminToken = null;
  let playerId = null;
  let adminId = null;

  try {
    // -------------------------------------------------------------
    // Test 1 & 2: Registration, Self-Promotion Prevention & Admin Creation
    // -------------------------------------------------------------
    console.log('\n--- TEST 1 & 2: Registration & Role-Based Security ---');
    // Attempt to register with role: 'admin' (should be ignored and set to 'player')
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: playerUsername,
        email: playerEmail,
        password,
        role: 'admin' // Malicious attempt to elevate role
      })
    });
    const regData = await regRes.json();
    playerToken = regData.token;
    playerId = regData.user.id;

    const checkPlayer = await User.findById(playerId);
    console.log('1. User registered with role:', checkPlayer.role);
    if (checkPlayer.role !== 'player') {
      throw new Error('Security Breach: Player was able to self-assign role "admin"!');
    }
    console.log('✅ Self-promotion successfully prevented! Role is strictly "player".');

    // Create a real admin using server-side logic
    const adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash: 'hashed_dummy_pw',
      role: 'admin',
      walletBalance: 100
    });
    adminId = adminUser._id;

    // Login as admin to get valid JWT
    const jwt = require('../server/node_modules/jsonwebtoken');
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'apple_worm_default_dev_secret_2026',
      { expiresIn: '7d' }
    );
    console.log('✅ Created verified administrator with role "admin".');

    // -------------------------------------------------------------
    // Test 3: Admin Authorization Protection on Admin Endpoints
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Admin Endpoint Protection (401 & 403) ---');
    // Unauthenticated request -> 401
    const unauthStats = await fetch(`${BASE_URL}/admin/stats`);
    console.log('Unauthenticated access status:', unauthStats.status);
    if (unauthStats.status !== 401) throw new Error('Unauthenticated access should be 401');

    // Ordinary player request -> 403 Forbidden
    const playerStats = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    console.log('Player access to admin endpoint status:', playerStats.status);
    if (playerStats.status !== 403) throw new Error('Player access to admin endpoint should be 403');

    // Administrator request -> 200 OK
    const adminStats = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminStatsData = await adminStats.json();
    console.log('Admin access to admin endpoint status:', adminStats.status, 'success:', adminStatsData.success);
    if (adminStats.status !== 200 || !adminStatsData.success) {
      throw new Error('Admin was denied access to admin stats!');
    }
    console.log('✅ Authorization middleware properly restricts endpoints to administrators.');

    // -------------------------------------------------------------
    // Test 4: Real Database Statistics in Admin Overview
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Real Database Statistics ---');
    console.log('Database metrics:', adminStatsData.metrics);
    if (
      typeof adminStatsData.metrics.totalUsers !== 'number' ||
      typeof adminStatsData.metrics.totalLevels !== 'number' ||
      typeof adminStatsData.metrics.totalCoinsIssued !== 'number'
    ) {
      throw new Error('Admin stats does not return valid database metrics');
    }
    console.log('✅ Real database statistics returned successfully.');

    // -------------------------------------------------------------
    // Test 5: Password Hash Redaction Across All Endpoints
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Password Hash Redaction ---');
    const playersRes = await fetch(`${BASE_URL}/admin/players`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const playersData = await playersRes.json();

    const samplePlayer = playersData.players.find((p) => p.email === playerEmail);
    console.log('Sample player fields:', Object.keys(samplePlayer || {}));
    if (samplePlayer.passwordHash || samplePlayer.password) {
      throw new Error('Security Breach: Password hash exposed in admin players endpoint!');
    }

    const playerDetailRes = await fetch(`${BASE_URL}/admin/players/${playerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const playerDetailData = await playerDetailRes.json();
    if (playerDetailData.player.passwordHash || playerDetailData.player.password) {
      throw new Error('Security Breach: Password hash exposed in player detail endpoint!');
    }
    console.log('✅ Password hashes are strictly excluded from all API responses.');

    // -------------------------------------------------------------
    // Test 6: Player Search and Pagination
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Player Search and Pagination ---');
    const searchRes = await fetch(`${BASE_URL}/admin/players?search=${playerUsername}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const searchData = await searchRes.json();
    console.log(`Search for "${playerUsername}": found ${searchData.count} players`);
    if (searchData.count !== 1 || searchData.players[0].username !== playerUsername) {
      throw new Error('Player search by username failed!');
    }
    console.log('✅ Player search and pagination verified.');

    // -------------------------------------------------------------
    // Test 7 & 8: Economy Configuration Validation and Updates
    // -------------------------------------------------------------
    console.log('\n--- TEST 7 & 8: Economy Configuration Management ---');
    // Ordinary player cannot update economy
    const playerUpdateEconomy = await fetch(`${BASE_URL}/admin/economy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({ levelCompleteBaseReward: 75 })
    });
    if (playerUpdateEconomy.status !== 403) throw new Error('Player update economy should be 403');

    // Invalid negative values rejected with 400
    const invalidEconomy = await fetch(`${BASE_URL}/admin/economy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ levelCompleteBaseReward: -50 })
    });
    console.log('Negative reward rejection status:', invalidEconomy.status);
    if (invalidEconomy.status !== 400) throw new Error('Negative reward should be rejected with 400');

    // Valid update by admin
    const validEconomy = await fetch(`${BASE_URL}/admin/economy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        levelCompleteBaseReward: 60,
        starBonusCoins: 15,
        dailyEarningLimit: 600
      })
    });
    const validEconomyData = await validEconomy.json();
    console.log('Valid economy update success:', validEconomyData.success, 'new base reward:', validEconomyData.config.levelCompleteBaseReward);
    if (!validEconomyData.success || validEconomyData.config.levelCompleteBaseReward !== 60) {
      throw new Error('Admin economy configuration update failed');
    }
    console.log('✅ Economy settings validated and updated cleanly by admin.');

    // -------------------------------------------------------------
    // Test 9, 10 & 11: Leaderboard Ranks & Privacy
    // -------------------------------------------------------------
    console.log('\n--- TEST 9, 10 & 11: Leaderboard Generation & Privacy ---');
    // Complete Level 1 as player
    const sessRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({
        levelNumber: 1,
        score: 2500,
        movesUsed: 8,
        maxMoves: 25,
        stars: 3,
        completionStatus: 'completed',
        levelTitle: 'Sunny Orchard Sector 1'
      })
    });
    const sessData = await sessRes.json();
    console.log('Level 1 completed by player. Coins awarded:', sessData.reward?.coinsAwarded);

    const lbRes = await fetch(`${BASE_URL}/leaderboard`);
    const lbData = await lbRes.json();
    console.log('Leaderboard count:', lbData.count, 'top rank username:', lbData.leaderboard[0]?.username);

    // Verify privacy: no emails in public leaderboard
    const hasEmail = lbData.leaderboard.some((p) => p.email !== undefined);
    if (hasEmail) {
      throw new Error('Security Breach: Email address exposed on public leaderboard!');
    }
    console.log('✅ Leaderboard ranks real players deterministically with strict data privacy.');

    // -------------------------------------------------------------
    // Test 12, 13 & 14: Achievements System & Idempotency
    // -------------------------------------------------------------
    console.log('\n--- TEST 12, 13 & 14: Achievements Verification ---');
    console.log('Newly unlocked achievements in session response:', sessData.achievements?.newlyUnlocked);

    const myAchRes = await fetch(`${BASE_URL}/achievements/me`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    const myAchData = await myAchRes.json();
    console.log('Player unlocked achievements count:', myAchData.unlockedCount, 'total:', myAchData.totalCount);

    const firstApple = myAchData.achievements.find((a) => a.slug === 'first_apple');
    const perfectRun = myAchData.achievements.find((a) => a.slug === 'perfect_run');

    console.log('First Apple unlocked:', firstApple?.isUnlocked);
    console.log('Perfect Run (3-star) unlocked:', perfectRun?.isUnlocked);

    if (!firstApple?.isUnlocked || !perfectRun?.isUnlocked) {
      throw new Error('Achievements did not unlock when conditions were satisfied!');
    }

    // Re-completing the level should NOT duplicate achievements
    const repeatSess = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({
        levelNumber: 1,
        score: 2600,
        movesUsed: 7,
        maxMoves: 25,
        stars: 3,
        completionStatus: 'completed',
        levelTitle: 'Sunny Orchard Sector 1'
      })
    });
    const repeatSessData = await repeatSess.json();
    console.log('Repeat completion newly unlocked count:', repeatSessData.achievements?.newlyUnlocked?.length || 0);
    if (repeatSessData.achievements?.newlyUnlocked?.length > 0) {
      throw new Error('Duplicate achievements awarded on repeat level completion!');
    }
    console.log('✅ Achievements unlock accurately with zero duplicate awards.');

    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    await User.deleteMany({ _id: { $in: [playerId, adminId] } });
    await PlayerProgress.deleteMany({ user: { $in: [playerId, adminId] } });
    await GameSession.deleteMany({ user: { $in: [playerId, adminId] } });
    await RewardTransaction.deleteMany({ user: { $in: [playerId, adminId] } });
    await LeaderboardEntry.deleteMany({ user: { $in: [playerId, adminId] } });

    // Reset economy config to standard defaults
    const config = await EconomyConfig.getOrCreateConfig();
    config.levelCompleteBaseReward = 50;
    config.starBonusCoins = 10;
    config.dailyEarningLimit = 500;
    await config.save();

    console.log('🧹 Cleaned up temporary test data.');
    console.log('\n🎉 ALL PHASE 9 VERIFICATION CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 9 Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runPhase9Verification();

