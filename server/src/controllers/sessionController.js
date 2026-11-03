// ==========================================
// Apple Worm Adventure - Game Session Controller
// ==========================================

const {
  GameSession,
  PlayerProgress,
  Level,
  User,
  RewardTransaction,
  EconomyConfig,
  LeaderboardEntry
} = require('../models');
const { evaluatePlayerAchievements } = require('./achievementController');

/**
 * @desc    Record a completed, failed, or abandoned game session
 * @route   POST /api/sessions
 * @access  Private (JWT)
 */
const recordSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      levelNumber,
      score = 0,
      movesUsed = 0,
      maxMoves = 0,
      stars = 0,
      completionStatus = 'completed',
      levelTitle = ''
    } = req.body;

    // 1. Validate Level Number
    const lvlNum = parseInt(levelNumber, 10);
    if (isNaN(lvlNum) || lvlNum < 1 || lvlNum > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level number. Must be between 1 and 50.'
      });
    }

    // 2. Validate Completion Status
    const validStatuses = ['completed', 'failed', 'abandoned'];
    if (!validStatuses.includes(completionStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid completion status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // 3. Retrieve or Initialize Player Progress
    let progress = await PlayerProgress.findOne({ user: userId });
    if (!progress) {
      progress = await PlayerProgress.create({
        user: userId,
        unlockedLevels: [1],
        completedLevels: [],
        starsEarned: 0,
        totalScore: 0,
        totalGamesPlayed: 0,
        lastPlayedLevel: 1,
        bestScores: []
      });
    }

    // 4. Security Check: Verify that the level is actually unlocked for this player
    if (!progress.unlockedLevels.includes(lvlNum)) {
      return res.status(403).json({
        success: false,
        message: `Level #${lvlNum} is locked. You must complete preceding levels first.`
      });
    }

    // 5. Numerical bounds validation
    const cleanScore = Math.max(0, Math.min(500000, parseInt(score, 10) || 0));
    const cleanMoves = Math.max(0, parseInt(movesUsed, 10) || 0);
    const cleanStars = Math.max(0, Math.min(3, parseInt(stars, 10) || 0));

    const isCompleted = completionStatus === 'completed';

    // 6. Update Progress if completed
    if (isCompleted) {
      // Find existing level score entry
      const existingScoreIndex = progress.bestScores.findIndex(
        (b) => b.levelNumber === lvlNum
      );

      if (existingScoreIndex >= 0) {
        const existing = progress.bestScores[existingScoreIndex];
        // Only update best score if higher (never overwrite higher with lower)
        const newHighScore = Math.max(existing.highScore, cleanScore);
        const newStars = Math.max(existing.stars, cleanStars);
        const newLeastMoves = existing.leastMoves !== null
          ? Math.min(existing.leastMoves, cleanMoves)
          : cleanMoves;

        progress.bestScores[existingScoreIndex].highScore = newHighScore;
        progress.bestScores[existingScoreIndex].stars = newStars;
        progress.bestScores[existingScoreIndex].leastMoves = newLeastMoves;
        progress.bestScores[existingScoreIndex].completedAt = new Date();
      } else {
        // First completion of this level
        progress.bestScores.push({
          levelNumber: lvlNum,
          highScore: cleanScore,
          stars: cleanStars,
          leastMoves: cleanMoves,
          completedAt: new Date()
        });
      }

      // Add to completedLevels if not present
      if (!progress.completedLevels.includes(lvlNum)) {
        progress.completedLevels.push(lvlNum);
      }

      // Unlock next level if available
      if (lvlNum < 50 && !progress.unlockedLevels.includes(lvlNum + 1)) {
        progress.unlockedLevels.push(lvlNum + 1);
      }

      // Recalculate stars and total score aggregate safely
      progress.recalculateAggregates();
    }

    // Increment overall games played and update last played level
    progress.totalGamesPlayed += 1;
    progress.lastPlayedLevel = lvlNum;

    await progress.save();

    // 7. Resolve Level ObjectId from database if present
    const levelDoc = await Level.findOne({ levelNumber: lvlNum }).select('_id title maxMoves');

    // 8. Create GameSession document in MongoDB Atlas
    const resolvedTitle = levelTitle || levelDoc?.title || `Level ${lvlNum}`;
    const resolvedMaxMoves = maxMoves || levelDoc?.maxMoves || 0;

    const session = await GameSession.create({
      user: userId,
      level: levelDoc?._id || null,
      levelNumber: lvlNum,
      levelTitle: resolvedTitle,
      score: cleanScore,
      movesUsed: cleanMoves,
      maxMoves: resolvedMaxMoves,
      stars: isCompleted ? cleanStars : 0,
      completionStatus,
      completedAt: isCompleted ? new Date() : null
    });

    // 9. Centralized Economy Reward Calculation & Wallet Credit (Phase 8)
    let rewardInfo = null;
    let currentWalletBalance = 0;

    const userDoc = await User.findById(userId).select('walletBalance');
    currentWalletBalance = userDoc ? userDoc.walletBalance : 0;

    if (isCompleted) {
      const config = await EconomyConfig.getOrCreateConfig();

      if (config.featuresEnabled && config.featuresEnabled.levelRewards) {
        const potentialReward = (config.levelCompleteBaseReward || 50) + (cleanStars * (config.starBonusCoins || 10));

        // Check daily earning limits for player
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [todayStats] = await RewardTransaction.aggregate([
          {
            $match: {
              user: userId,
              coinAmount: { $gt: 0 },
              createdAt: { $gte: startOfToday }
            }
          },
          {
            $group: {
              _id: null,
              earnedToday: { $sum: '$coinAmount' }
            }
          }
        ]);

        const earnedToday = todayStats?.earnedToday || 0;
        const dailyCap = config.dailyEarningLimit || 500;
        const capRemaining = Math.max(0, dailyCap - earnedToday);
        const coinsAwarded = Math.min(potentialReward, capRemaining);

        const key = req.body.idempotencyKey || `idemp_lvl_${lvlNum}_sess_${session._id}`;
        const existingTx = await RewardTransaction.findOne({ idempotencyKey: key });

        if (!existingTx && coinsAwarded > 0) {
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: coinsAwarded } },
            { returnDocument: 'after' }
          );

          currentWalletBalance = updatedUser.walletBalance;

          const tx = await RewardTransaction.create({
            user: userId,
            transactionType: 'earning',
            coinAmount: coinsAwarded,
            balanceAfter: updatedUser.walletBalance,
            reason: `Level ${lvlNum} completed (${cleanStars} stars)`,
            rewardSource: 'level_complete',
            relatedSession: session._id,
            levelNumber: lvlNum,
            idempotencyKey: key,
            metadata: {
              baseReward: config.levelCompleteBaseReward,
              starBonus: cleanStars * config.starBonusCoins,
              starsEarned: cleanStars,
              dailyCapApplied: coinsAwarded < potentialReward
            }
          });

          rewardInfo = {
            eligible: true,
            coinsAwarded,
            potentialReward,
            dailyCapApplied: coinsAwarded < potentialReward,
            canDouble: coinsAwarded > 0 && config.featuresEnabled.doubleRewards,
            transactionId: tx._id,
            sessionId: session._id
          };
        } else if (existingTx) {
          rewardInfo = {
            eligible: true,
            coinsAwarded: existingTx.coinAmount,
            potentialReward,
            canDouble: existingTx.coinAmount > 0 && config.featuresEnabled.doubleRewards,
            transactionId: existingTx._id,
            sessionId: session._id
          };
        } else {
          rewardInfo = {
            eligible: true,
            coinsAwarded: 0,
            potentialReward,
            dailyCapReached: true,
            canDouble: false,
            sessionId: session._id
          };
        }
      }
    }

    // 10. Upsert level-specific LeaderboardEntry and evaluate achievements (Phase 9)
    let newlyUnlockedAchievements = [];

    if (isCompleted) {
      try {
        const existingLb = await LeaderboardEntry.findOne({ user: userId, level: lvlNum });
        if (!existingLb) {
          await LeaderboardEntry.create({
            user: userId,
            level: lvlNum,
            score: cleanScore,
            movesUsed: cleanMoves
          });
        } else if (cleanScore > existingLb.score) {
          existingLb.score = cleanScore;
          existingLb.movesUsed = cleanMoves;
          await existingLb.save();
        }

        newlyUnlockedAchievements = await evaluatePlayerAchievements(
          userId,
          progress,
          userDoc,
          session
        );
      } catch (err) {
        console.warn('Leaderboard/Achievement update non-fatal warning:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: isCompleted
        ? `Level ${lvlNum} completed and saved successfully!`
        : `Game session recorded with status: ${completionStatus}`,
      session: {
        id: session._id,
        levelNumber: session.levelNumber,
        levelTitle: session.levelTitle,
        score: session.score,
        movesUsed: session.movesUsed,
        maxMoves: session.maxMoves,
        stars: session.stars,
        completionStatus: session.completionStatus,
        completedAt: session.completedAt,
        createdAt: session.createdAt
      },
      reward: rewardInfo,
      walletBalance: currentWalletBalance,
      achievements: {
        unlockedCount: progress.achievements ? progress.achievements.length : 0,
        newlyUnlocked: newlyUnlockedAchievements
      },
      progress: {
        userId: progress.user,
        unlockedLevels: progress.unlockedLevels,
        completedLevels: progress.completedLevels,
        completedLevelsCount: progress.completedLevels.length,
        currentUnlockedLevel: Math.max(...progress.unlockedLevels, 1),
        lastPlayedLevel: progress.lastPlayedLevel,
        totalStars: progress.starsEarned,
        totalScore: progress.totalScore,
        totalGamesPlayed: progress.totalGamesPlayed,
        bestScores: progress.bestScores
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current player's recent game sessions history
 * @route   GET /api/sessions/me
 * @access  Private (JWT)
 */
const getMySessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const sessions = await GameSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s._id,
        levelNumber: s.levelNumber,
        levelTitle: s.levelTitle || `Level ${s.levelNumber}`,
        score: s.score,
        movesUsed: s.movesUsed,
        maxMoves: s.maxMoves,
        stars: s.stars,
        completionStatus: s.completionStatus,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSession,
  getMySessions
};

