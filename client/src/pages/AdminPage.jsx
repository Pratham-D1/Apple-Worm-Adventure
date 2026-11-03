// ==========================================
// Apple Worm Adventure - Admin Dashboard (Phase 9)
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { apiRequest } from '../config/api';
import './pages.css';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'players' | 'economy'

  // Tab 1: Stats & Overview
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Tab 2: Player Management
  const [players, setPlayers] = useState([]);
  const [playerPagination, setPlayerPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Tab 3: Economy Configuration
  const [economyForm, setEconomyForm] = useState(null);
  const [loadingEconomy, setLoadingEconomy] = useState(false);
  const [savingEconomy, setSavingEconomy] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [economyNotice, setEconomyNotice] = useState(null);

  // ------------------------------------------
  // Fetch Functions
  // ------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const res = await apiRequest('/admin/stats');
      if (res.success) {
        setStats(res);
      }
    } catch (err) {
      setStatsError(err.message || 'Failed to load live database metrics');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchPlayers = useCallback(async (page = 1) => {
    try {
      setLoadingPlayers(true);
      let queryUrl = `/admin/players?page=${page}&limit=10`;
      if (searchQuery.trim()) queryUrl += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (roleFilter) queryUrl += `&role=${roleFilter}`;

      const res = await apiRequest(queryUrl);
      if (res.success) {
        setPlayers(res.players || []);
        setPlayerPagination({ page: res.page, pages: res.pages, total: res.total });
      }
    } catch (err) {
      console.warn('Failed to fetch player list:', err.message);
    } finally {
      setLoadingPlayers(false);
    }
  }, [searchQuery, roleFilter]);

  const fetchEconomy = useCallback(async () => {
    try {
      setLoadingEconomy(true);
      const res = await apiRequest('/admin/economy');
      if (res.success && res.config) {
        setEconomyForm({
          levelCompleteBaseReward: res.config.levelCompleteBaseReward ?? 50,
          starBonusCoins: res.config.starBonusCoins ?? 10,
          dailyEarningLimit: res.config.dailyEarningLimit ?? 500,
          dailyClaimLimit: res.config.dailyClaimLimit ?? 10,
          doubleRewardMultiplier: res.config.doubleRewardMultiplier ?? 2,
          mockAdRewardCoins: res.config.mockAdRewardCoins ?? 30,
          dailyMockAdLimit: res.config.dailyMockAdLimit ?? 5,
          dailyLoginBonus: res.config.dailyLoginBonus ?? 25,
          boosterPrices: {
            extra_moves: res.config.boosterPrices?.extra_moves ?? 40,
            smart_hint: res.config.boosterPrices?.smart_hint ?? 30,
            revive_token: res.config.boosterPrices?.revive_token ?? 60,
            double_score: res.config.boosterPrices?.double_score ?? 50
          },
          featuresEnabled: {
            levelRewards: res.config.featuresEnabled?.levelRewards ?? true,
            doubleRewards: res.config.featuresEnabled?.doubleRewards ?? true,
            dailyBonus: res.config.featuresEnabled?.dailyBonus ?? true,
            mockAds: res.config.featuresEnabled?.mockAds ?? true,
            boosterStore: res.config.featuresEnabled?.boosterStore ?? true
          }
        });
      }
    } catch (err) {
      setEconomyNotice({ type: 'error', text: err.message || 'Failed to load economy configuration' });
    } finally {
      setLoadingEconomy(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'players') fetchPlayers(1);
    if (activeTab === 'economy' && !economyForm) fetchEconomy();
  }, [activeTab, fetchPlayers, fetchEconomy, economyForm]);

  // ------------------------------------------
  // Economy Save Handlers
  // ------------------------------------------
  const handleOpenConfirmEconomy = (e) => {
    e.preventDefault();
    setConfirmModalOpen(true);
  };

  const handleSaveEconomyConfirmed = async () => {
    setSavingEconomy(true);
    setConfirmModalOpen(false);
    try {
      const res = await apiRequest('/admin/economy', {
        method: 'PUT',
        body: JSON.stringify(economyForm)
      });
      if (res.success) {
        setEconomyNotice({ type: 'success', text: '✅ Economy configuration updated successfully in MongoDB Atlas!' });
        fetchEconomy();
      } else {
        setEconomyNotice({ type: 'error', text: res.message || 'Failed to update economy configuration' });
      }
    } catch (err) {
      setEconomyNotice({ type: 'error', text: err.message || 'Configuration update rejected' });
    } finally {
      setSavingEconomy(false);
    }
  };

  // Inspect Player Details
  const handleInspectPlayer = async (playerId) => {
    try {
      const res = await apiRequest(`/admin/players/${playerId}`);
      if (res.success) {
        setSelectedPlayer(res.player);
        setInspectModalOpen(true);
      }
    } catch (err) {
      alert(`Could not load player details: ${err.message}`);
    }
  };

  const m = stats?.metrics;

  return (
    <div className="admin-page-container">
      {/* 1. Page Heading */}
      <div className="page-header">
        <div className="admin-header-row">
          <div>
            <h1>Admin Panel</h1>
            <p className="page-subtitle">
              System overview, player management, audit ledgers, and centralized economy rules.
            </p>
          </div>
          <div className="admin-header-badges">
            <Badge variant="danger" size="sm">
              🛡️ Administrator
            </Badge>
            <button
              type="button"
              className="dash-action-btn"
              onClick={fetchStats}
              disabled={loadingStats}
            >
              {loadingStats ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      {statsError && (
        <div className="auth-error-banner" role="alert">
          <span>⚠️ {statsError}</span>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="world-filter-wrapper">
        <div className="world-filter-tabs" role="tablist">
          <button
            type="button"
            className={`world-filter-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 System Overview
          </button>
          <button
            type="button"
            className={`world-filter-pill ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            👥 Players ({playerPagination.total || (m?.totalUsers ?? '...')})
          </button>
          <button
            type="button"
            className={`world-filter-pill ${activeTab === 'economy' ? 'active' : ''}`}
            onClick={() => setActiveTab('economy')}
          >
            🪙 Economy Rules
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SYSTEM OVERVIEW & METRICS */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metric Cards (3x2 Desktop Grid) */}
          <div className="dashboard-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-box">👥</div>
              <div className="metric-content">
                <span className="metric-label">Registered Accounts</span>
                <span className="metric-value">{loadingStats ? '...' : m?.totalUsers ?? 0}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box">🎮</div>
              <div className="metric-content">
                <span className="metric-label">Active Players (Last 7d)</span>
                <span className="metric-value">{loadingStats ? '...' : m?.activePlayersCount ?? 0}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box">🏆</div>
              <div className="metric-content">
                <span className="metric-label">Level Victories Recorded</span>
                <span className="metric-value">{loadingStats ? '...' : m?.completedSessions ?? 0}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box">🗺️</div>
              <div className="metric-content">
                <span className="metric-label">Seeded Puzzle Levels</span>
                <span className="metric-value">{loadingStats ? '...' : m?.totalLevels ?? 50}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box">🪙</div>
              <div className="metric-content">
                <span className="metric-label">Total Coins Minted</span>
                <span className="metric-value text-green">+{loadingStats ? '...' : (m?.totalCoinsIssued ?? 0).toLocaleString()} 🟡</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box">🛍️</div>
              <div className="metric-content">
                <span className="metric-label">Total Coins Redeemed</span>
                <span className="metric-value text-red">-{loadingStats ? '...' : (m?.totalCoinsSpent ?? 0).toLocaleString()} 🟡</span>
              </div>
            </div>
          </div>

          {/* Activity Tables Grid */}
          <div className="admin-tables-grid">
            {/* Recent Gameplay Sessions */}
            <Card className="admin-table-card">
              <div className="admin-table-header">
                <h3>🎮 Recent Game Sessions (Live Atlas DB)</h3>
                <span className="sample-data-badge">Last 10 Attempts</span>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Level</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!stats?.recentSessions || stats.recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="table-empty">No recent game sessions recorded yet.</td>
                      </tr>
                    ) : (
                      stats.recentSessions.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.username}</strong></td>
                          <td>Level {s.levelNumber}</td>
                          <td>{s.score} pts</td>
                          <td>
                            <Badge variant={s.status === 'completed' ? 'success' : 'danger'} size="sm">
                              {s.status}
                            </Badge>
                          </td>
                          <td className="table-date">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent Reward Transactions */}
            <Card className="admin-table-card">
              <div className="admin-table-header">
                <h3>📑 Recent Reward Ledger Transactions</h3>
                <span className="sample-data-badge">Immutable Audit</span>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Post Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="table-empty">No transactions recorded yet.</td>
                      </tr>
                    ) : (
                      stats.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td><strong>{tx.username}</strong></td>
                          <td>
                            <span className={tx.amount > 0 ? 'text-green' : 'text-red'}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🟡
                            </span>
                          </td>
                          <td>
                            <span>{tx.reason}</span>
                            <span className="table-subtext">{tx.source?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="tx-balance-after">{tx.balanceAfter} 🟡</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PLAYER MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'players' && (
        <Card className="admin-players-card">
          <div className="players-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchPlayers(1); }}
                className="form-input search-input"
              />
              <Button size="sm" variant="primary" onClick={() => fetchPlayers(1)}>
                Search
              </Button>
            </div>

            <div className="role-filter-box">
              <label htmlFor="role-select">Role:</label>
              <select
                id="role-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-input select-role-input"
              >
                <option value="">All Roles</option>
                <option value="player">Players</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {loadingPlayers ? (
            <div className="empty-history-state">
              <span className="empty-icon animate-bounce">⏳</span>
              <p>Searching player accounts...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="empty-history-state">
              <span className="empty-icon">👥</span>
              <h3>No Players Found</h3>
              <p>No user accounts matched the given search query or filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username &amp; Email</th>
                    <th>Role</th>
                    <th>Wallet Balance</th>
                    <th>Levels Cleared</th>
                    <th>Stars Earned</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.username}</strong>
                        <span className="table-subtext">{p.email}</span>
                      </td>
                      <td>
                        <Badge variant={p.role === 'admin' ? 'danger' : 'default'} size="sm">
                          {p.role}
                        </Badge>
                      </td>
                      <td>
                        <strong>{p.walletBalance}</strong> 🟡
                      </td>
                      <td>
                        <span>🏁 {p.progress?.completedLevelsCount || 0} / 50</span>
                      </td>
                      <td>
                        <span className="stars-pill">⭐ {p.progress?.starsEarned || 0}</span>
                      </td>
                      <td className="table-date">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInspectPlayer(p.id)}
                        >
                          👁️ Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {playerPagination.pages > 1 && (
            <div className="pagination-bar">
              <Button
                size="sm"
                variant="outline"
                disabled={playerPagination.page <= 1}
                onClick={() => fetchPlayers(playerPagination.page - 1)}
              >
                &larr; Previous
              </Button>
              <span className="pagination-info">
                Page {playerPagination.page} of {playerPagination.pages} ({playerPagination.total} Total)
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={playerPagination.page >= playerPagination.pages}
                onClick={() => fetchPlayers(playerPagination.page + 1)}
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ECONOMY CONFIGURATION MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'economy' && (
        <Card className="admin-config-card">
          <div className="config-header">
            <div>
              <h2>🪙 Centralized Economy Configuration</h2>
              <p className="config-desc">
                Configure level rewards, daily limits, mock ad simulation, and booster store prices in MongoDB Atlas.
              </p>
            </div>
            <Badge variant="gold" size="sm">
              Model: EconomyConfig
            </Badge>
          </div>

          {economyNotice && (
            <div
              className={`wallet-toast-banner ${economyNotice.type === 'error' ? 'toast-error' : 'toast-success'}`}
              role="alert"
            >
              <span>{economyNotice.text}</span>
            </div>
          )}

          {loadingEconomy || !economyForm ? (
            <div className="empty-history-state">
              <span className="empty-icon animate-bounce">⏳</span>
              <p>Loading centralized economy parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleOpenConfirmEconomy} className="admin-config-form">
              {/* Gameplay Rewards */}
              <div className="config-group-section">
                <h3>🎮 Level Completion Earning Rules</h3>
                <div className="config-fields-grid">
                  <div className="form-group">
                    <label htmlFor="cfg-base-reward">Base Level Reward (Coins)</label>
                    <input
                      id="cfg-base-reward"
                      type="number"
                      className="form-input"
                      value={economyForm.levelCompleteBaseReward}
                      onChange={(e) => setEconomyForm({ ...economyForm, levelCompleteBaseReward: Number(e.target.value) })}
                      min="0"
                      max="1000"
                      required
                    />
                    <span className="form-hint">Base coins awarded for victory (default: 50)</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-star-bonus">Star Bonus Coins</label>
                    <input
                      id="cfg-star-bonus"
                      type="number"
                      className="form-input"
                      value={economyForm.starBonusCoins}
                      onChange={(e) => setEconomyForm({ ...economyForm, starBonusCoins: Number(e.target.value) })}
                      min="0"
                      max="500"
                      required
                    />
                    <span className="form-hint">Bonus coins per star earned (e.g. 3 stars = +30 coins)</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-daily-limit">Daily Earning Limit (Anti-Farming Cap)</label>
                    <input
                      id="cfg-daily-limit"
                      type="number"
                      className="form-input"
                      value={economyForm.dailyEarningLimit}
                      onChange={(e) => setEconomyForm({ ...economyForm, dailyEarningLimit: Number(e.target.value) })}
                      min="0"
                      max="10000"
                      required
                    />
                    <span className="form-hint">Maximum coins a player can earn in 24h (default: 500)</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-double-mult">Double Reward Multiplier</label>
                    <input
                      id="cfg-double-mult"
                      type="number"
                      className="form-input"
                      value={economyForm.doubleRewardMultiplier}
                      onChange={(e) => setEconomyForm({ ...economyForm, doubleRewardMultiplier: Number(e.target.value) })}
                      min="1"
                      max="5"
                      required
                    />
                    <span className="form-hint">Multiplier on level victory modal (default: 2x)</span>
                  </div>
                </div>
              </div>

              {/* Bonus Claims & Rewarded Ad Simulator */}
              <div className="config-group-section">
                <h3>🎁 Bonus Claims &amp; Demo Ad Simulator</h3>
                <div className="config-fields-grid">
                  <div className="form-group">
                    <label htmlFor="cfg-daily-login">Daily Login Bonus (Coins)</label>
                    <input
                      id="cfg-daily-login"
                      type="number"
                      className="form-input"
                      value={economyForm.dailyLoginBonus}
                      onChange={(e) => setEconomyForm({ ...economyForm, dailyLoginBonus: Number(e.target.value) })}
                      min="0"
                      max="500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-mock-ad-reward">Demo Ad View Reward (Coins)</label>
                    <input
                      id="cfg-mock-ad-reward"
                      type="number"
                      className="form-input"
                      value={economyForm.mockAdRewardCoins}
                      onChange={(e) => setEconomyForm({ ...economyForm, mockAdRewardCoins: Number(e.target.value) })}
                      min="0"
                      max="500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-mock-ad-limit">Daily Demo Ad Limit (Views/Day)</label>
                    <input
                      id="cfg-mock-ad-limit"
                      type="number"
                      className="form-input"
                      value={economyForm.dailyMockAdLimit}
                      onChange={(e) => setEconomyForm({ ...economyForm, dailyMockAdLimit: Number(e.target.value) })}
                      min="0"
                      max="50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Booster Store Pricing */}
              <div className="config-group-section">
                <h3>🛍️ Booster &amp; Power-Up Store Prices (Coins)</h3>
                <div className="config-fields-grid">
                  <div className="form-group">
                    <label htmlFor="cfg-b-moves">Extra Moves (+5)</label>
                    <input
                      id="cfg-b-moves"
                      type="number"
                      className="form-input"
                      value={economyForm.boosterPrices.extra_moves}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          boosterPrices: { ...economyForm.boosterPrices, extra_moves: Number(e.target.value) }
                        })
                      }
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-b-hint">Smart Apple Hint</label>
                    <input
                      id="cfg-b-hint"
                      type="number"
                      className="form-input"
                      value={economyForm.boosterPrices.smart_hint}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          boosterPrices: { ...economyForm.boosterPrices, smart_hint: Number(e.target.value) }
                        })
                      }
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-b-revive">Revive Token</label>
                    <input
                      id="cfg-b-revive"
                      type="number"
                      className="form-input"
                      value={economyForm.boosterPrices.revive_token}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          boosterPrices: { ...economyForm.boosterPrices, revive_token: Number(e.target.value) }
                        })
                      }
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cfg-b-score">Double Score Boost</label>
                    <input
                      id="cfg-b-score"
                      type="number"
                      className="form-input"
                      value={economyForm.boosterPrices.double_score}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          boosterPrices: { ...economyForm.boosterPrices, double_score: Number(e.target.value) }
                        })
                      }
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="config-group-section">
                <h3>🛡️ Economy Feature Toggles</h3>
                <div className="features-toggle-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={economyForm.featuresEnabled.levelRewards}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          featuresEnabled: { ...economyForm.featuresEnabled, levelRewards: e.target.checked }
                        })
                      }
                    />
                    <span>Level Completion Rewards</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={economyForm.featuresEnabled.doubleRewards}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          featuresEnabled: { ...economyForm.featuresEnabled, doubleRewards: e.target.checked }
                        })
                      }
                    />
                    <span>2x Victory Double Coins</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={economyForm.featuresEnabled.dailyBonus}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          featuresEnabled: { ...economyForm.featuresEnabled, dailyBonus: e.target.checked }
                        })
                      }
                    />
                    <span>Daily Login Bonus</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={economyForm.featuresEnabled.mockAds}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          featuresEnabled: { ...economyForm.featuresEnabled, mockAds: e.target.checked }
                        })
                      }
                    />
                    <span>Rewarded Demo Ad Simulator</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={economyForm.featuresEnabled.boosterStore}
                      onChange={(e) =>
                        setEconomyForm({
                          ...economyForm,
                          featuresEnabled: { ...economyForm.featuresEnabled, boosterStore: e.target.checked }
                        })
                      }
                    />
                    <span>Power-Up Booster Store</span>
                  </label>
                </div>
              </div>

              <div className="config-form-actions">
                <Button type="submit" variant="primary" size="lg" disabled={savingEconomy}>
                  {savingEconomy ? 'Saving...' : '💾 Save Economy Configuration'}
                </Button>
                <Button type="button" variant="outline" size="md" onClick={fetchEconomy}>
                  Reset to Server Values
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Confirmation Modal Before Saving Economy Changes */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="⚠️ Confirm Economy Configuration Update"
      >
        <div className="confirm-modal-body">
          <p>
            Are you sure you want to apply these economy configuration changes to the live MongoDB Atlas database?
          </p>
          <ul className="confirm-changes-list">
            <li><strong>Base Level Reward:</strong> {economyForm?.levelCompleteBaseReward} Coins</li>
            <li><strong>Star Bonus:</strong> +{economyForm?.starBonusCoins} Coins/Star</li>
            <li><strong>Daily Earning Cap:</strong> {economyForm?.dailyEarningLimit} Coins</li>
            <li><strong>Demo Ad View:</strong> +{economyForm?.mockAdRewardCoins} Coins (Limit: {economyForm?.dailyMockAdLimit}/day)</li>
          </ul>
          <p className="admin-security-note">
            🔒 Changes take effect immediately across all game sessions and player wallet transactions.
          </p>
          <div className="confirm-modal-actions">
            <Button variant="outline" size="md" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveEconomyConfirmed}>
              Yes, Apply Configuration
            </Button>
          </div>
        </div>
      </Modal>

      {/* Player Inspection Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`👤 Player Profile: ${selectedPlayer.username}`}
        >
          <div className="player-inspect-modal-body">
            <div className="inspect-header-info">
              <div>
                <h4>{selectedPlayer.username}</h4>
                <p className="inspect-email">{selectedPlayer.email}</p>
              </div>
              <Badge variant={selectedPlayer.role === 'admin' ? 'danger' : 'gold'} size="md">
                {selectedPlayer.role}
              </Badge>
            </div>

            <div className="inspect-stats-grid">
              <div className="inspect-stat-pill">
                <span className="lbl">Wallet Balance</span>
                <span className="val">🟡 {selectedPlayer.walletBalance}</span>
              </div>
              <div className="inspect-stat-pill">
                <span className="lbl">Levels Cleared</span>
                <span className="val">🏁 {selectedPlayer.progress?.completedLevels?.length || 0} / 50</span>
              </div>
              <div className="inspect-stat-pill">
                <span className="lbl">Total Stars</span>
                <span className="val">⭐ {selectedPlayer.progress?.starsEarned || 0} / 150</span>
              </div>
              <div className="inspect-stat-pill">
                <span className="lbl">Total Score</span>
                <span className="val">{selectedPlayer.progress?.totalScore?.toLocaleString() || 0} pts</span>
              </div>
            </div>

            {/* Inventory owned */}
            <div className="inspect-section">
              <h5>🎒 Booster Inventory</h5>
              <div className="inspect-inventory-row">
                <span className="inv-tag">👟 Extra Moves: {selectedPlayer.inventory?.extraMoves || 0}</span>
                <span className="inv-tag">💡 Smart Hints: {selectedPlayer.inventory?.smartHints || 0}</span>
                <span className="inv-tag">💖 Revives: {selectedPlayer.inventory?.reviveTokens || 0}</span>
                <span className="inv-tag">⭐ Score Boosts: {selectedPlayer.inventory?.doubleScoreBoosts || 0}</span>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="inspect-section">
              <h5>🎮 Recent Game Sessions ({selectedPlayer.recentSessions?.length || 0})</h5>
              <div className="table-responsive">
                <table className="admin-table mini-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Score</th>
                      <th>Stars</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedPlayer.recentSessions || selectedPlayer.recentSessions.length === 0 ? (
                      <tr>
                        <td colSpan="4">No sessions recorded.</td>
                      </tr>
                    ) : (
                      selectedPlayer.recentSessions.map((s) => (
                        <tr key={s.id}>
                          <td>Level {s.levelNumber}</td>
                          <td>{s.score} pts</td>
                          <td>⭐ {s.stars}</td>
                          <td>{s.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="confirm-modal-actions" style={{ marginTop: '1rem' }}>
              <Button variant="primary" size="md" onClick={() => setInspectModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
