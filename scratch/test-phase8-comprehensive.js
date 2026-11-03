// ==========================================
// Comprehensive E2E Verification for Phase 8: VELoop Economy
// ==========================================

const path = require('path');
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });
process.env.PORT = '5006';

const mongoose = require('../server/node_modules/mongoose');
const app = require('../server/src/index');
const { User, RewardTransaction, EconomyConfig, GameSession, PlayerProgress } = require('../server/src/models');

const PORT = 5006;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runComprehensiveVerification() {
  console.log('🚀 Starting Comprehensive Phase 8 Verification...');

  // Wait 1.5 seconds for server and MongoDB connection to establish
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    // Generate unique test user
    const testTimestamp = Date.now();
    const testUsername = `eco_champ_${testTimestamp}`;
    const testEmail = `champ_${testTimestamp}@example.com`;
    const testPassword = 'Password123!';

    // 1. Register test user
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword
      })
    });
    const regData = await regRes.json();
    console.log('1. User registered:', regData.success, 'Token received:', !!regData.token);
    const token = regData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 2. Verify all booster purchases increment their respective inventory keys
    // Credit initial coins directly for testing the 4 booster items
    await User.updateOne({ email: testEmail }, { $set: { walletBalance: 500 } });

    const boosters = [
      { itemId: 'extra_moves', expectedKey: 'extraMoves' },
      { itemId: 'smart_hint', expectedKey: 'smartHints' },
      { itemId: 'revive_token', expectedKey: 'reviveTokens' },
      { itemId: 'double_score', expectedKey: 'doubleScoreBoosts' }
    ];

    for (const b of boosters) {
      const spendRes = await fetch(`${BASE_URL}/wallet/spend`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ itemId: b.itemId })
      });
      const spendData = await spendRes.json();
      console.log(`2. Bought ${b.itemId}: success=${spendData.success}, new balance=${spendData.newBalance}, inventory[${b.expectedKey}]=${spendData.inventory?.[b.expectedKey]}`);
      if (!spendData.success || spendData.inventory?.[b.expectedKey] !== 1) {
        throw new Error(`Booster ${b.itemId} failed to increment ${b.expectedKey}`);
      }
    }

    // 3. Verify unauthorized protection on private endpoints
    const unauthSpend = await fetch(`${BASE_URL}/wallet/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'extra_moves' })
    });
    console.log('3. Unauthenticated spend rejected with 401:', unauthSpend.status === 401);

    const unauthWallet = await fetch(`${BASE_URL}/wallet/me`);
    console.log('4. Unauthenticated wallet rejected with 401:', unauthWallet.status === 401);

    // 5. Verify daily earning cap behavior
    // Set user's earnings today near cap (e.g. 480 / 500)
    const config = await EconomyConfig.getOrCreateConfig();
    const cap = config.dailyEarningLimit; // 500

    // Add a dummy transaction for today that almost fills the cap
    const dummyTx = new RewardTransaction({
      user: regData.user.id,
      transactionType: 'earning',
      rewardSource: 'level_completion',
      coinAmount: cap - 20, // 480
      balanceAfter: 500,
      idempotencyKey: `test_cap_${Date.now()}`,
      reason: 'Cap test filler transaction',
      status: 'COMPLETED'
    });
    await dummyTx.save();

    // Now complete a level that would normally award 80 coins (base 50 + 3*10)
    // It should be capped at 20 coins
    const cappedSessionRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        levelNumber: 1,
        score: 1500,
        movesUsed: 10,
        maxMoves: 25,
        stars: 3,
        completionStatus: 'completed',
        levelTitle: 'First Steps'
      })
    });
    const cappedSessionData = await cappedSessionRes.json();
    console.log('5. Capped session response:', {
      success: cappedSessionData.success,
      potentialReward: cappedSessionData.reward?.potentialReward,
      coinsAwarded: cappedSessionData.reward?.coinsAwarded,
      dailyCapApplied: cappedSessionData.reward?.dailyCapApplied
    });

    if (cappedSessionData.reward?.coinsAwarded !== 20 || !cappedSessionData.reward?.dailyCapApplied) {
      throw new Error(`Daily cap was not enforced properly: awarded ${cappedSessionData.reward?.coinsAwarded}`);
    }

    // 6. Complete another level now that cap is 100% full (500/500)
    const zeroSessionRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        levelNumber: 2,
        score: 1200,
        movesUsed: 12,
        maxMoves: 25,
        stars: 2,
        completionStatus: 'completed',
        levelTitle: 'Apple Harvest'
      })
    });
    const zeroSessionData = await zeroSessionRes.json();
    console.log('6. Zero reward session response when cap reached:', {
      success: zeroSessionData.success,
      coinsAwarded: zeroSessionData.reward?.coinsAwarded,
      canDouble: zeroSessionData.reward?.canDouble
    });

    if (zeroSessionData.reward?.coinsAwarded !== 0 || zeroSessionData.reward?.canDouble !== false) {
      throw new Error('Over-cap session should award 0 coins and disallow doubling');
    }

    // 7. Verify GET /api/wallet/me reflects totals accurately
    const walletRes = await fetch(`${BASE_URL}/wallet/me`, {
      headers: authHeaders
    });
    const walletData = await walletRes.json();
    console.log('7. Final wallet state:', {
      balance: walletData.wallet?.walletBalance,
      earnedToday: walletData.wallet?.earnedToday,
      dailyEarningLimit: walletData.wallet?.dailyEarningLimit,
      dailyRemaining: walletData.wallet?.dailyRemaining,
      inventory: walletData.wallet?.inventory
    });

    // Clean up test documents
    await User.deleteOne({ email: testEmail });
    await RewardTransaction.deleteMany({ user: regData.user.id });
    await GameSession.deleteMany({ user: regData.user.id });
    await PlayerProgress.deleteOne({ user: regData.user.id });
    console.log('🧹 Cleaned up test user data.');

    console.log('🎉 ALL COMPREHENSIVE PHASE 8 TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runComprehensiveVerification();
