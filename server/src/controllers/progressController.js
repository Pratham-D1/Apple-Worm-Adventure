// ==========================================
// Apple Worm Adventure - Progress Controller
// ==========================================

const { PlayerProgress, Level } = require('../models');

/**
 * @desc    Get current authenticated player's progress
 * @route   GET /api/progress/me
 * @access  Private (JWT)
 */
const getMyProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let progress = await PlayerProgress.findOne({ user: userId });

    // If player does not have progress document yet, initialize it
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

    const currentUnlockedLevel = Math.max(...progress.unlockedLevels, 1);

    return res.status(200).json({
      success: true,
      progress: {
        userId: progress.user,
        unlockedLevels: progress.unlockedLevels,
        completedLevels: progress.completedLevels,
        completedLevelsCount: progress.completedLevels.length,
        currentUnlockedLevel,
        lastPlayedLevel: progress.lastPlayedLevel || 1,
        totalStars: progress.starsEarned,
        totalScore: progress.totalScore,
        totalGamesPlayed: progress.totalGamesPlayed,
        bestScores: progress.bestScores,
        updatedAt: progress.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all 50 levels with current player's unlock and completion status
 * @route   GET /api/levels/progress
 * @access  Private (JWT)
 */
const getLevelsProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let progress = await PlayerProgress.findOne({ user: userId });
    if (!progress) {
      progress = {
        unlockedLevels: [1],
        completedLevels: [],
        starsEarned: 0,
        totalScore: 0,
        totalGamesPlayed: 0,
        lastPlayedLevel: 1,
        bestScores: []
      };
    }

    // Map through all 50 levels
    const levelsProgress = [];
    for (let i = 1; i <= 50; i++) {
      const isUnlocked = progress.unlockedLevels.includes(i);
      const isCompleted = progress.completedLevels.includes(i);
      const best = progress.bestScores.find((b) => b.levelNumber === i);

      levelsProgress.push({
        levelNumber: i,
        isUnlocked,
        isCompleted,
        stars: best?.stars || 0,
        highScore: best?.highScore || 0,
        leastMoves: best?.leastMoves || null
      });
    }

    return res.status(200).json({
      success: true,
      levels: levelsProgress,
      summary: {
        totalLevels: 50,
        completedCount: progress.completedLevels.length,
        totalStars: progress.starsEarned,
        totalScore: progress.totalScore,
        currentUnlockedLevel: Math.max(...progress.unlockedLevels, 1),
        lastPlayedLevel: progress.lastPlayedLevel || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProgress,
  getLevelsProgress
};

