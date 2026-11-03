// ==========================================
// Apple Worm Adventure - Leaderboard Controller (Phase 9)
// ==========================================

const { PlayerProgress, LeaderboardEntry, User } = require('../models');

/**
 * @desc    Get deterministic global or level-specific player leaderboard
 * @route   GET /api/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const levelFilter = req.query.level ? parseInt(req.query.level, 10) : null;

    // ------------------------------------------
    // Scenario A: Level-Specific Leaderboard
    // ------------------------------------------
    if (levelFilter && !isNaN(levelFilter) && levelFilter >= 1 && levelFilter <= 50) {
      const query = { level: levelFilter };

      const [total, entries] = await Promise.all([
        LeaderboardEntry.countDocuments(query),
        LeaderboardEntry.find(query)
          .sort({ score: -1, movesUsed: 1, createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'username')
      ]);

      const rankings = entries
        .filter((entry) => entry.user && entry.user.username)
        .map((entry, index) => ({
          rank: skip + index + 1,
          userId: entry.user._id,
          username: entry.user.username,
          level: entry.level,
          score: entry.score,
          movesUsed: entry.movesUsed,
          recordedAt: entry.createdAt
        }));

      return res.status(200).json({
        success: true,
        type: 'level',
        levelNumber: levelFilter,
        count: rankings.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        leaderboard: rankings
      });
    }

    // ------------------------------------------
    // Scenario B: Global Campaign Leaderboard
    // ------------------------------------------
    // Ranking criteria (deterministic):
    // 1. totalScore DESC
    // 2. starsEarned DESC
    // 3. completedLevels.length DESC
    // 4. createdAt ASC (deterministic tie-breaker)
    const [total, progresses] = await Promise.all([
      PlayerProgress.countDocuments(),
      PlayerProgress.find()
        .populate('user', 'username createdAt')
        .sort({ totalScore: -1, starsEarned: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
    ]);

    const rankings = progresses
      .filter((p) => p.user && p.user.username)
      .map((p, index) => {
        const completedLevelsCount = p.completedLevels ? p.completedLevels.length : 0;
        return {
          rank: skip + index + 1,
          userId: p.user._id,
          username: p.user.username,
          totalScore: p.totalScore || 0,
          starsEarned: p.starsEarned || 0,
          completedLevelsCount,
          totalGamesPlayed: p.totalGamesPlayed || 0,
          lastPlayedLevel: p.lastPlayedLevel || 1,
          joinedAt: p.user.createdAt
        };
      });

    return res.status(200).json({
      success: true,
      type: 'global',
      count: rankings.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      leaderboard: rankings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard
};

