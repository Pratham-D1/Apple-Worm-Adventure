// ==========================================
// Apple Worm Adventure - Achievement Controller (Phase 9)
// ==========================================

const { Achievement, PlayerProgress, User, RewardTransaction } = require('../models');

/**
 * Evaluates player eligibility for achievements based on authoritative database state.
 * Returns array of newly unlocked achievements.
 */
const evaluatePlayerAchievements = async (userId, playerProgress, userDoc, currentSession = null) => {
  const newlyUnlocked = [];

  try {
    const existingSlugs = new Set((playerProgress.achievements || []).map((a) => a.slug));
    const allAchievements = await Achievement.find().sort({ 'requirements.target': 1 });

    const completedCount = playerProgress.completedLevels ? playerProgress.completedLevels.length : 0;
    const starsEarned = playerProgress.starsEarned || 0;
    const walletBalance = userDoc ? userDoc.walletBalance : 0;
    const hasThreeStarLevel = (playerProgress.bestScores || []).some((b) => b.stars === 3) ||
      (currentSession && currentSession.stars === 3);

    for (const ach of allAchievements) {
      if (existingSlugs.has(ach.slug)) {
        continue;
      }

      let isEligible = false;

      switch (ach.requirements.type) {
        case 'levels_completed':
          isEligible = completedCount >= ach.requirements.target;
          break;
        case 'stars_collected':
          isEligible = starsEarned >= ach.requirements.target;
          break;
        case 'three_star_levels':
          isEligible = hasThreeStarLevel;
          break;
        case 'wallet_coins':
          isEligible = walletBalance >= ach.requirements.target;
          break;
        default:
          isEligible = false;
      }

      if (isEligible) {
        const unlockRecord = {
          slug: ach.slug,
          name: ach.name,
          description: ach.description,
          badgeIcon: ach.badgeIcon,
          rewardAmount: ach.rewardAmount,
          unlockedAt: new Date()
        };

        playerProgress.achievements.push(unlockRecord);
        newlyUnlocked.push(unlockRecord);

        // Credit achievement reward coins if applicable
        if (ach.rewardAmount > 0) {
          const idempotencyKey = `idemp_ach_${ach.slug}_${userId}`;
          const existingTx = await RewardTransaction.findOne({ idempotencyKey });

          if (!existingTx) {
            const updatedUser = await User.findByIdAndUpdate(
              userId,
              { $inc: { walletBalance: ach.rewardAmount } },
              { returnDocument: 'after' }
            );

            await RewardTransaction.create({
              user: userId,
              transactionType: 'bonus',
              coinAmount: ach.rewardAmount,
              balanceAfter: updatedUser ? updatedUser.walletBalance : walletBalance + ach.rewardAmount,
              reason: `Achievement Unlocked: "${ach.name}"`,
              rewardSource: 'achievement_bonus',
              idempotencyKey,
              metadata: {
                achievementSlug: ach.slug,
                achievementName: ach.name
              }
            });
          }
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      await playerProgress.save();
    }
  } catch (err) {
    console.error('Error in evaluatePlayerAchievements:', err.message);
  }

  return newlyUnlocked;
};

/**
 * @desc    Get all available achievement blueprints
 * @route   GET /api/achievements
 * @access  Public
 */
const getAllAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ category: 1, 'requirements.target': 1 });

    return res.status(200).json({
      success: true,
      count: achievements.length,
      achievements: achievements.map((a) => ({
        id: a._id,
        slug: a.slug,
        name: a.name,
        category: a.category,
        description: a.description,
        requirements: a.requirements,
        rewardAmount: a.rewardAmount,
        badgeIcon: a.badgeIcon
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated player's achievements with unlock status and progress
 * @route   GET /api/achievements/me
 * @access  Private (JWT)
 */
const getMyAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let [progress, user, allAchievements] = await Promise.all([
      PlayerProgress.findOne({ user: userId }),
      User.findById(userId),
      Achievement.find().sort({ category: 1, 'requirements.target': 1 })
    ]);

    if (!progress) {
      progress = await PlayerProgress.create({
        user: userId,
        unlockedLevels: [1],
        completedLevels: [],
        starsEarned: 0,
        totalScore: 0,
        totalGamesPlayed: 0
      });
    }

    // Evaluate in case player achieved conditions outside game session
    await evaluatePlayerAchievements(userId, progress, user);

    const unlockedMap = new Map(
      (progress.achievements || []).map((a) => [a.slug, a.unlockedAt])
    );

    const completedCount = progress.completedLevels ? progress.completedLevels.length : 0;
    const starsEarned = progress.starsEarned || 0;
    const walletBalance = user ? user.walletBalance : 0;
    const hasThreeStar = (progress.bestScores || []).some((b) => b.stars === 3);

    const achievements = allAchievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.slug);
      const unlockedAt = unlockedMap.get(ach.slug) || null;

      let currentVal = 0;
      switch (ach.requirements.type) {
        case 'levels_completed':
          currentVal = completedCount;
          break;
        case 'stars_collected':
          currentVal = starsEarned;
          break;
        case 'three_star_levels':
          currentVal = hasThreeStar ? 1 : 0;
          break;
        case 'wallet_coins':
          currentVal = walletBalance;
          break;
        default:
          currentVal = 0;
      }

      const target = ach.requirements.target;
      const progressPercent = Math.min(100, Math.round((currentVal / target) * 100));

      return {
        id: ach._id,
        slug: ach.slug,
        name: ach.name,
        category: ach.category,
        description: ach.description,
        requirements: ach.requirements,
        rewardAmount: ach.rewardAmount,
        badgeIcon: ach.badgeIcon,
        isUnlocked,
        unlockedAt,
        progress: {
          current: currentVal,
          target,
          percentage: isUnlocked ? 100 : progressPercent
        }
      };
    });

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

    return res.status(200).json({
      success: true,
      totalCount: achievements.length,
      unlockedCount,
      completionPercentage: Math.round((unlockedCount / achievements.length) * 100),
      achievements
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  evaluatePlayerAchievements,
  getAllAchievements,
  getMyAchievements
};

