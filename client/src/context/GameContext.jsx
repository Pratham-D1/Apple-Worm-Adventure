// ==========================================
// Apple Worm Adventure - Game Context (Phase 8)
// ==========================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ALL_LEVELS, INITIAL_USER } from '../data/mockData';
import { apiRequest } from '../config/api';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  // Initialize levels
  const [levels, setLevels] = useState(() => {
    try {
      const saved = localStorage.getItem('awa_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === ALL_LEVELS.length) {
          return parsed;
        }
      }
      return ALL_LEVELS;
    } catch {
      return ALL_LEVELS;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('awa_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('awa_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastRewardDetails, setLastRewardDetails] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [achievementsData, setAchievementsData] = useState(null);
  const [loadingAchievements, setLoadingAchievements] = useState(false);

  /**
   * Fetch authenticated player's achievements and progress
   */
  const fetchAchievements = useCallback(async () => {
    const token = localStorage.getItem('awa_token');
    if (!token) return;
    try {
      setLoadingAchievements(true);
      const res = await apiRequest('/achievements/me');
      if (res.success) {
        setAchievementsData(res);
      }
    } catch (err) {
      console.warn('Could not fetch achievements:', err.message);
    } finally {
      setLoadingAchievements(false);
    }
  }, []);

  /**
   * Fetch authenticated player's authoritative progress, sessions, and wallet from MongoDB Atlas
   */
  const fetchServerProgress = useCallback(async () => {
    const token = localStorage.getItem('awa_token');
    if (!token) return;

    setLoadingProgress(true);
    setProgressError(null);
    try {
      const [progRes, sessRes, walletRes, achRes] = await Promise.all([
        apiRequest('/progress/me'),
        apiRequest('/sessions/me?limit=15'),
        apiRequest('/wallet/me').catch(() => null),
        apiRequest('/achievements/me').catch(() => null)
      ]);

      if (progRes.success && progRes.progress) {
        const sp = progRes.progress;
        setUser((prev) => ({
          ...prev,
          totalScore: sp.totalScore || 0,
          totalStars: sp.totalStars || 0,
          completedLevelsCount: sp.completedLevelsCount || 0,
          gamesPlayed: sp.totalGamesPlayed || 0,
          lastPlayedLevel: sp.lastPlayedLevel || 1,
          unlockedLevels: sp.unlockedLevels || [1],
          completedLevels: sp.completedLevels || []
        }));

        setLevels((prevLevels) =>
          prevLevels.map((lvl) => {
            const isUnlocked = sp.unlockedLevels.includes(lvl.id);
            const isCompleted = sp.completedLevels.includes(lvl.id);
            const best = sp.bestScores.find((b) => b.levelNumber === lvl.id);
            return {
              ...lvl,
              isUnlocked,
              isCompleted,
              stars: best?.stars || 0,
              highScore: best?.highScore || 0
            };
          })
        );
      }

      if (walletRes && walletRes.success && walletRes.wallet) {
        setUser((prev) => ({
          ...prev,
          walletBalance: walletRes.wallet.walletBalance ?? prev.walletBalance,
          inventory: walletRes.wallet.inventory || prev.inventory
        }));
      }

      if (sessRes && sessRes.success && Array.isArray(sessRes.sessions)) {
        setHistory(
          sessRes.sessions.map((s) => ({
            id: s.id,
            levelNumber: s.levelNumber,
            levelTitle: s.levelTitle,
            score: s.score,
            movesUsed: s.movesUsed,
            maxMoves: s.maxMoves,
            stars: s.stars,
            status:
              s.completionStatus === 'completed'
                ? 'Completed'
                : s.completionStatus === 'failed'
                ? 'Failed'
                : 'Abandoned',
            date: new Date(s.createdAt).toLocaleString()
          }))
        );
      }

      if (achRes && achRes.success) {
        setAchievementsData(achRes);
      }
    } catch (err) {
      console.warn('Could not sync progress with backend database:', err.message);
      setProgressError(err.message || 'Failed to sync with cloud progress');
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  // Fetch on mount or whenever token changes
  useEffect(() => {
    fetchServerProgress();
  }, [fetchServerProgress]);

  // Sync to local storage for quick access / offline cache
  useEffect(() => {
    try {
      localStorage.setItem('awa_levels', JSON.stringify(levels));
      localStorage.setItem('awa_user', JSON.stringify(user));
      localStorage.setItem('awa_history', JSON.stringify(history));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  }, [levels, user, history]);

  /**
   * Completes a level, persists session and awards centralized coins in MongoDB Atlas
   */
  const completeLevel = async (levelId, score, stars, movesUsed) => {
    const currentLvl = levels.find((l) => l.id === levelId);
    let earnedCoins = 50 + stars * 10;
    let sessionId = null;

    // 1. Optimistic UI update for immediate player feedback
    setLevels((prevLevels) =>
      prevLevels.map((lvl) => {
        if (lvl.id === levelId) {
          return {
            ...lvl,
            isCompleted: true,
            stars: Math.max(lvl.stars || 0, stars),
            highScore: Math.max(lvl.highScore || 0, score)
          };
        }
        if (lvl.id === levelId + 1 && levelId < 50) {
          return { ...lvl, isUnlocked: true };
        }
        return lvl;
      })
    );

    // 2. Authoritative save to MongoDB Atlas if authenticated
    const token = localStorage.getItem('awa_token');
    if (token) {
      try {
        const res = await apiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            levelNumber: levelId,
            score,
            movesUsed,
            maxMoves: currentLvl?.maxMoves || 0,
            stars,
            completionStatus: 'completed',
            levelTitle: currentLvl?.title || `Level ${levelId}`
          })
        });

        if (res.success && res.progress) {
          const sp = res.progress;
          sessionId = res.session?.id || null;

          if (res.reward) {
            earnedCoins = res.reward.coinsAwarded;
            setLastRewardDetails({
              coinsAwarded: res.reward.coinsAwarded,
              potentialReward: res.reward.potentialReward,
              canDouble: res.reward.canDouble,
              sessionId,
              levelNumber: levelId
            });
          }

          setUser((prev) => ({
            ...prev,
            totalScore: sp.totalScore,
            totalStars: sp.totalStars,
            completedLevelsCount: sp.completedLevelsCount,
            gamesPlayed: sp.totalGamesPlayed,
            lastPlayedLevel: sp.lastPlayedLevel,
            unlockedLevels: sp.unlockedLevels,
            completedLevels: sp.completedLevels,
            walletBalance: res.walletBalance !== undefined ? res.walletBalance : prev.walletBalance
          }));

          setLevels((prevLevels) =>
            prevLevels.map((lvl) => {
              const isUnlocked = sp.unlockedLevels.includes(lvl.id);
              const isCompleted = sp.completedLevels.includes(lvl.id);
              const best = sp.bestScores.find((b) => b.levelNumber === lvl.id);
              return {
                ...lvl,
                isUnlocked,
                isCompleted,
                stars: best?.stars || 0,
                highScore: best?.highScore || 0
              };
            })
          );

          if (res.session) {
            const newSess = {
              id: res.session.id,
              levelNumber: res.session.levelNumber,
              levelTitle: res.session.levelTitle,
              score: res.session.score,
              movesUsed: res.session.movesUsed,
              maxMoves: res.session.maxMoves,
              stars: res.session.stars,
              status: 'Completed',
              date: new Date(res.session.createdAt).toLocaleString()
            };
            setHistory((prev) => [newSess, ...prev.filter((h) => h.id !== newSess.id).slice(0, 14)]);
          }

          const newlyUnlockedAchievements = res.achievements?.newlyUnlocked || [];
          if (newlyUnlockedAchievements.length > 0) {
            fetchAchievements();
          }

          return { earnedCoins, sessionId, newlyUnlockedAchievements };
        }
      } catch (err) {
        console.warn('Failed to record session on backend server:', err.message);
      }
    }

    // Local fallback for guest
    setUser((prevUser) => {
      const isFirst = !levels.find((l) => l.id === levelId)?.isCompleted;
      return {
        ...prevUser,
        totalScore: (prevUser.totalScore || 0) + score,
        totalStars: (prevUser.totalStars || 0) + stars,
        completedLevelsCount: isFirst
          ? (prevUser.completedLevelsCount || 0) + 1
          : prevUser.completedLevelsCount || 0,
        gamesPlayed: (prevUser.gamesPlayed || 0) + 1,
        lastPlayedLevel: levelId,
        walletBalance: (prevUser.walletBalance || 0) + earnedCoins
      };
    });

    const newHistoryEntry = {
      id: `gh_${Date.now()}`,
      levelNumber: currentLvl?.levelNumber || levelId,
      levelTitle: currentLvl?.title || `Level ${levelId}`,
      score,
      movesUsed,
      maxMoves: currentLvl?.maxMoves || 20,
      stars,
      status: 'Completed',
      date: new Date().toLocaleString()
    };
    setHistory((prev) => [newHistoryEntry, ...prev.slice(0, 14)]);

    return { earnedCoins, sessionId };
  };

  /**
   * Claim 2x double reward for eligible session
   */
  const doubleReward = async (sessionId) => {
    try {
      const res = await apiRequest('/rewards/double', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });
      if (res.success) {
        setUser((prev) => ({
          ...prev,
          walletBalance: res.newBalance
        }));
        if (lastRewardDetails && lastRewardDetails.sessionId === sessionId) {
          setLastRewardDetails((prev) => ({ ...prev, canDouble: false }));
        }
        return { success: true, bonusCoins: res.bonusCoins, newBalance: res.newBalance };
      }
      return { success: false, message: res.message || 'Could not double reward' };
    } catch (err) {
      return { success: false, message: err.message || 'Double reward claim failed' };
    }
  };

  /**
   * Spend coins to purchase booster
   */
  const spendCoins = async (itemId) => {
    try {
      const res = await apiRequest('/wallet/spend', {
        method: 'POST',
        body: JSON.stringify({ itemId })
      });
      if (res.success) {
        setUser((prev) => ({
          ...prev,
          walletBalance: res.newBalance,
          inventory: res.inventory || prev.inventory
        }));
        return { success: true, ...res };
      }
      return { success: false, message: res.message || 'Purchase failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Purchase error' };
    }
  };

  /**
   * Claim daily bonus or simulated ad reward
   */
  const claimRewardAction = async (claimType) => {
    try {
      const res = await apiRequest('/rewards/claim', {
        method: 'POST',
        body: JSON.stringify({ claimType })
      });
      if (res.success) {
        setUser((prev) => ({
          ...prev,
          walletBalance: res.newBalance !== undefined ? res.newBalance : prev.walletBalance,
          inventory: res.inventory || prev.inventory
        }));
        return { success: true, ...res };
      }
      return { success: false, message: res.message || 'Claim failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Claim failed' };
    }
  };

  /**
   * Record a failed session in MongoDB
   */
  const recordFailedSession = async (levelId, score = 0, movesUsed = 0) => {
    const currentLvl = levels.find((l) => l.id === levelId);
    const token = localStorage.getItem('awa_token');
    if (token) {
      try {
        const res = await apiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            levelNumber: levelId,
            score,
            movesUsed,
            maxMoves: currentLvl?.maxMoves || 0,
            stars: 0,
            completionStatus: 'failed',
            levelTitle: currentLvl?.title || `Level ${levelId}`
          })
        });

        if (res.session) {
          const newSess = {
            id: res.session.id,
            levelNumber: res.session.levelNumber,
            levelTitle: res.session.levelTitle,
            score: res.session.score,
            movesUsed: res.session.movesUsed,
            maxMoves: res.session.maxMoves,
            stars: 0,
            status: 'Failed',
            date: new Date(res.session.createdAt).toLocaleString()
          };
          setHistory((prev) => [newSess, ...prev.filter((h) => h.id !== newSess.id).slice(0, 14)]);
        }
      } catch (err) {
        console.warn('Could not record failed session on server:', err.message);
      }
    }
  };

  const login = (username, email) => {
    setUser((prev) => ({
      ...prev,
      username: username || prev.username,
      email: email || prev.email
    }));
    setTimeout(() => {
      fetchServerProgress();
    }, 50);
  };

  const logout = () => {
    setLevels(ALL_LEVELS.map((lvl) => ({
      ...lvl,
      isUnlocked: lvl.id === 1,
      isCompleted: false,
      stars: 0,
      highScore: 0
    })));
    setUser({
      ...INITIAL_USER,
      totalScore: 0,
      totalStars: 0,
      completedLevelsCount: 0,
      gamesPlayed: 0,
      lastPlayedLevel: 1,
      walletBalance: 0,
      inventory: {
        extraMoves: 0,
        smartHints: 0,
        reviveTokens: 0,
        doubleScoreBoosts: 0
      }
    });
    setHistory([]);
    setLastRewardDetails(null);
    localStorage.removeItem('awa_levels');
    localStorage.removeItem('awa_user');
    localStorage.removeItem('awa_history');
  };

  const resetProgress = () => {
    logout();
  };

  return (
    <GameContext.Provider
      value={{
        levels,
        user,
        history,
        lastRewardDetails,
        loadingProgress,
        progressError,
        achievementsData,
        loadingAchievements,
        fetchAchievements,
        fetchServerProgress,
        completeLevel,
        doubleReward,
        spendCoins,
        claimRewardAction,
        recordFailedSession,
        login,
        logout,
        resetProgress
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
