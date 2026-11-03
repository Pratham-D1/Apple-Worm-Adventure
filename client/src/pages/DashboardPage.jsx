// ==========================================
// Apple Worm Adventure - Player Dashboard Page (Phase 7)
// ==========================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import './pages.css';

export const DashboardPage = () => {
  const { user: authUser, logout: authLogout } = useAuth();
  const {
    user: gameUser,
    levels,
    history,
    loadingProgress,
    progressError,
    achievementsData,
    loadingAchievements,
    fetchServerProgress,
    fetchAchievements,
    logout: gameLogout
  } = useGame();

  const navigate = useNavigate();

  // Refresh progress and achievements from MongoDB Atlas on mount
  useEffect(() => {
    fetchServerProgress();
    fetchAchievements();
  }, [fetchServerProgress, fetchAchievements]);

  const username = authUser?.username || gameUser?.username || 'Player';
  const email = authUser?.email || gameUser?.email || 'player@appleworm.dev';
  const role = authUser?.role || 'player';
  const walletBalance = authUser?.walletBalance ?? gameUser?.walletBalance ?? 0;
  const joinedDate = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : (gameUser?.joinedDate || 'Recently');

  // Determine appropriate next level to continue playing
  const uncompletedUnlocked = levels.find((l) => l.isUnlocked && !l.isCompleted);
  let continueLevel = 1;
  if (uncompletedUnlocked) {
    continueLevel = uncompletedUnlocked.id;
  } else if (gameUser.lastPlayedLevel && levels.find((l) => l.id === gameUser.lastPlayedLevel)?.isUnlocked) {
    continueLevel = gameUser.lastPlayedLevel;
  } else if (levels.every((l) => l.isCompleted)) {
    continueLevel = 50;
  }

  // Calculate stats from authoritative game state
  const completedCount = gameUser.completedLevelsCount ?? levels.filter((l) => l.isCompleted).length;
  const totalStars = gameUser.totalStars ?? levels.reduce((acc, l) => acc + (l.stars || 0), 0);
  const totalScore = gameUser.totalScore ?? levels.reduce((acc, l) => acc + (l.highScore || 0), 0);
  const totalGamesPlayed = gameUser.gamesPlayed ?? history.length;
  const currentUnlockedLevel = Math.max(...levels.filter((l) => l.isUnlocked).map((l) => l.id), 1);

  const handleLogout = () => {
    authLogout();
    gameLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* 1. Page Heading */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">
          Track your campaign progress, player statistics, and unlocked achievements.
        </p>
      </div>

      {/* Header Profile Banner */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-left">
          <div className="dashboard-avatar-box">
            <span className="dash-avatar-large">{gameUser?.avatar || '🐛'}</span>
            <span className="dash-online-badge">Online</span>
          </div>

          <div className="dashboard-user-info">
            <div className="user-title-row">
              <h2 className="user-name-title">{username}</h2>
              <Badge variant={role === 'admin' ? 'danger' : 'gold'} size="sm">
                {role === 'admin' ? '🛡️ Administrator' : '⭐ Level Adventurer'}
              </Badge>
            </div>
            <p className="user-email-meta">
              <span>📧 {email}</span> &bull; <span>Member since {joinedDate}</span>
            </p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dash-play-btn"
            onClick={() => navigate(`/game/${continueLevel}`)}
            title={`Continue playing Level #${continueLevel}`}
          >
            ▶ Play Level #{continueLevel}
          </button>

          <button
            type="button"
            className="dash-action-btn"
            onClick={() => navigate('/levels')}
            title="Browse all 50 levels"
          >
            🗺️ Levels
          </button>

          <button
            type="button"
            className="dash-action-btn"
            onClick={fetchServerProgress}
            title="Refresh latest cloud progress from MongoDB Atlas"
            disabled={loadingProgress}
          >
            {loadingProgress ? 'Syncing...' : '🔄 Sync'}
          </button>
        </div>
      </div>

      {/* Cloud Sync Error Alert */}
      {progressError && (
        <div className="auth-error-banner" role="alert">
          <span>⚠️ {progressError}. Check backend connection.</span>
          <Button size="sm" variant="outline" onClick={fetchServerProgress} style={{ marginLeft: '1rem' }}>
            Retry
          </Button>
        </div>
      )}

      {/* Primary Player Metric Cards (6-Grid: 3x2 Symmetrical Desktop) */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box">🏁</div>
          <div className="metric-content">
            <span className="metric-label">Levels Cleared</span>
            <span className="metric-value">{completedCount} <span className="metric-total">/ 50</span></span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box">🔓</div>
          <div className="metric-content">
            <span className="metric-label">Current Unlocked</span>
            <span className="metric-value">Level #{currentUnlockedLevel}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box">⭐</div>
          <div className="metric-content">
            <span className="metric-label">Total Stars Earned</span>
            <span className="metric-value text-amber">{totalStars} <span className="metric-total">/ 150</span></span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box">🏆</div>
          <div className="metric-content">
            <span className="metric-label">Best Total Score</span>
            <span className="metric-value">{totalScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box">🎮</div>
          <div className="metric-content">
            <span className="metric-label">Total Games Played</span>
            <span className="metric-value">{totalGamesPlayed}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box">🟡</div>
          <div className="metric-content">
            <span className="metric-label">VELoop Coins</span>
            <span className="metric-value text-amber">{walletBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Phase 9: Player Achievements Showcase */}
      <div className="dashboard-achievements-section">
        <div className="section-title-row">
          <div>
            <h2>🏆 Achievements &amp; Trophies</h2>
            <p className="section-subtitle">
              Milestone badges earned through puzzle mastery, star collection, and orchard progress.
            </p>
          </div>
          <Badge variant="gold" size="sm">
            {achievementsData?.unlockedCount || 0} / {achievementsData?.totalCount || 10} Unlocked ({achievementsData?.completionPercentage || 0}%)
          </Badge>
        </div>

        {/* Achievement Progress Bar */}
        <div className="ach-progress-track">
          <div
            className="ach-progress-bar"
            style={{ width: `${achievementsData?.completionPercentage || 0}%` }}
          />
        </div>

        {loadingAchievements && !achievementsData ? (
          <div className="empty-history-state">
            <span className="empty-icon animate-bounce">⏳</span>
            <p>Loading achievement badges...</p>
          </div>
        ) : (
          <div className="achievements-grid">
            {(achievementsData?.achievements || []).map((ach) => (
              <Card
                key={ach.id || ach.slug}
                className={`achievement-card ${ach.isUnlocked ? 'ach-unlocked' : 'ach-locked'}`}
              >
                <div className="ach-header">
                  <span className={`ach-icon ${ach.isUnlocked ? 'ach-icon-glow animate-bounce' : 'ach-icon-muted'}`}>
                    {ach.badgeIcon}
                  </span>
                  <div className="ach-badge-group">
                    <span className="ach-category-tag">{ach.category}</span>
                    {ach.rewardAmount > 0 && (
                      <span className="ach-reward-tag">+{ach.rewardAmount} 🟡</span>
                    )}
                  </div>
                </div>

                <div className="ach-body">
                  <h4 className="ach-title">{ach.name}</h4>
                  <p className="ach-desc">{ach.description}</p>
                </div>

                <div className="ach-footer">
                  {ach.isUnlocked ? (
                    <div className="ach-status-unlocked">
                      <span>✅ Unlocked {new Date(ach.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ) : (
                    <div className="ach-status-locked">
                      <div className="ach-progress-mini-row">
                        <span className="mini-lbl">Progress</span>
                        <span className="mini-val">{ach.progress.current} / {ach.progress.target}</span>
                      </div>
                      <div className="ach-mini-track">
                        <div
                          className="ach-mini-bar"
                          style={{ width: `${ach.progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Game History Table */}
      <div className="dashboard-history-section">
        <div className="section-title-row">
          <h2>Recent Game Sessions</h2>
          <span className="sample-data-badge">
            {loadingProgress ? 'Syncing with Atlas...' : '☁️ Persistent MongoDB Session History'}
          </span>
        </div>

        <Card className="history-table-card">
          {history.length === 0 ? (
            <div className="empty-history-state">
              <span className="empty-icon">🎮</span>
              <p>No recent game sessions recorded yet. Play a level to start building your game ledger!</p>
              <Button size="sm" variant="primary" icon="▶️" onClick={() => navigate(`/game/${continueLevel}`)}>
                Play Level #{continueLevel}
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="game-history-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Moves</th>
                    <th>Stars</th>
                    <th>Status</th>
                    <th>Recorded Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => {
                    const isSuccess = entry.status === 'Completed';
                    return (
                      <tr key={entry.id}>
                        <td>
                          <strong>Level {entry.levelNumber}</strong>
                          <span className="table-subtext">{entry.levelTitle || `Orchard Sector ${entry.levelNumber}`}</span>
                        </td>
                        <td>{entry.score ? `${entry.score.toLocaleString()} pts` : '0 pts'}</td>
                        <td>
                          {entry.movesUsed} {entry.maxMoves ? `/ ${entry.maxMoves}` : ''}
                        </td>
                        <td>
                          <span className="history-stars">
                            {entry.stars > 0 ? '⭐'.repeat(entry.stars) : '—'}
                          </span>
                        </td>
                        <td>
                          <Badge
                            variant={isSuccess ? 'success' : 'danger'}
                            size="sm"
                          >
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="table-date">{entry.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
