// ==========================================
// Apple Worm Adventure - Admin Controller (Phase 9)
// ==========================================

const mongoose = require('mongoose');
const { User, Level, GameSession, RewardTransaction, PlayerProgress } = require('../models');

/**
 * @desc    Get comprehensive live database statistics and activity for administrators
 * @route   GET /api/admin/stats (and alias GET /api/admin/overview)
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      adminCount,
      playerCount,
      totalLevels,
      totalSessions,
      completedSessions,
      failedSessions,
      activeUserIds,
      [issuedStats],
      [spentStats],
      recentSessions,
      recentTransactions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'player' }),
      Level.countDocuments(),
      GameSession.countDocuments(),
      GameSession.countDocuments({ completionStatus: 'completed' }),
      GameSession.countDocuments({ completionStatus: 'failed' }),
      GameSession.distinct('user', { createdAt: { $gte: sevenDaysAgo } }),
      RewardTransaction.aggregate([
        { $match: { coinAmount: { $gt: 0 } } },
        { $group: { _id: null, totalIssued: { $sum: '$coinAmount' } } }
      ]),
      RewardTransaction.aggregate([
        { $match: { coinAmount: { $lt: 0 } } },
        { $group: { _id: null, totalSpent: { $sum: { $abs: '$coinAmount' } } } }
      ]),
      GameSession.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .select('levelNumber levelTitle score movesUsed maxMoves stars completionStatus createdAt user'),
      RewardTransaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .select('transactionType coinAmount balanceAfter reason rewardSource idempotencyKey createdAt user')
    ]);

    const totalCoinsIssued = issuedStats?.totalIssued || 0;
    const totalCoinsSpent = spentStats?.totalSpent || 0;
    const activePlayersCount = activeUserIds.length;

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        adminCount,
        playerCount,
        totalLevels,
        totalSessions,
        completedSessions,
        failedSessions,
        totalCoinsIssued,
        totalCoinsSpent,
        activePlayersCount
      },
      recentSessions: recentSessions.map((s) => ({
        id: s._id,
        levelNumber: s.levelNumber,
        levelTitle: s.levelTitle,
        score: s.score,
        movesUsed: s.movesUsed,
        maxMoves: s.maxMoves,
        stars: s.stars,
        status: s.completionStatus,
        username: s.user?.username || 'Unknown',
        createdAt: s.createdAt
      })),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx._id,
        username: tx.user?.username || 'Unknown',
        type: tx.transactionType,
        amount: tx.coinAmount,
        balanceAfter: tx.balanceAfter,
        source: tx.rewardSource,
        reason: tx.reason,
        idempotencyKey: tx.idempotencyKey,
        createdAt: tx.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated, searchable list of registered players with progress summaries
 * @route   GET /api/admin/players
 * @access  Private (Admin only)
 */
const getAdminPlayers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.role && ['player', 'admin'].includes(req.query.role)) {
      query.role = req.query.role;
    }

    if (req.query.search && req.query.search.trim()) {
      const sanitizedSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [{ username: searchRegex }, { email: searchRegex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash')
    ]);

    // Enrich with PlayerProgress summaries
    const userIds = users.map((u) => u._id);
    const progresses = await PlayerProgress.find({ user: { $in: userIds } });
    const progressMap = new Map(progresses.map((p) => [p.user.toString(), p]));

    const players = users.map((u) => {
      const prog = progressMap.get(u._id.toString());
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        walletBalance: u.walletBalance,
        inventory: u.inventory,
        createdAt: u.createdAt,
        progress: {
          unlockedLevelsCount: prog?.unlockedLevels?.length || 1,
          completedLevelsCount: prog?.completedLevels?.length || 0,
          starsEarned: prog?.starsEarned || 0,
          totalScore: prog?.totalScore || 0,
          totalGamesPlayed: prog?.totalGamesPlayed || 0,
          lastPlayedLevel: prog?.lastPlayedLevel || 1
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: players.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      players
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed individual player record including recent sessions and ledger
 * @route   GET /api/admin/players/:id
 * @access  Private (Admin only)
 */
const getAdminPlayerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid player ID format'
      });
    }

    const [user, progress, sessions, transactions] = await Promise.all([
      User.findById(id).select('-passwordHash'),
      PlayerProgress.findOne({ user: id }),
      GameSession.find({ user: id }).sort({ createdAt: -1 }).limit(10),
      RewardTransaction.find({ user: id }).sort({ createdAt: -1 }).limit(10)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    return res.status(200).json({
      success: true,
      player: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        inventory: user.inventory,
        createdAt: user.createdAt,
        progress: progress || {
          unlockedLevels: [1],
          completedLevels: [],
          starsEarned: 0,
          totalScore: 0,
          totalGamesPlayed: 0
        },
        recentSessions: sessions.map((s) => ({
          id: s._id,
          levelNumber: s.levelNumber,
          levelTitle: s.levelTitle,
          score: s.score,
          movesUsed: s.movesUsed,
          stars: s.stars,
          status: s.completionStatus,
          createdAt: s.createdAt
        })),
        recentTransactions: transactions.map((t) => ({
          id: t._id,
          type: t.transactionType,
          amount: t.coinAmount,
          balanceAfter: t.balanceAfter,
          reason: t.reason,
          source: t.rewardSource,
          idempotencyKey: t.idempotencyKey,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAdminPlayers,
  getAdminPlayerById
};

