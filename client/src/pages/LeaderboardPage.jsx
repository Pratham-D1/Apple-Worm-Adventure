// ==========================================
// Apple Worm Adventure - Global Leaderboard Page (Phase 9)
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../config/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import './pages.css';

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('global'); // 'global' or level number string
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('1');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = activeTab === 'global'
        ? '/leaderboard?limit=50'
        : `/leaderboard?level=${selectedLevel}&limit=50`;

      const res = await apiRequest(endpoint);
      if (res.success) {
        setLeaderboard(res.leaderboard || []);
      } else {
        throw new Error(res.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve leaderboard rankings');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedLevel]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: '#1' };
    if (rank === 2) return { icon: '🥈', label: '#2' };
    if (rank === 3) return { icon: '🥉', label: '#3' };
    return { icon: `#${rank}`, label: `#${rank}` };
  };

  return (
    <div className="leaderboard-page-container">
      {/* 1. Page Heading */}
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p className="page-subtitle">
          Top puzzle solvers ranked by score, stars, and speed.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="leaderboard-filter-tabs">
        <Button
          variant={activeTab === 'global' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('global')}
        >
          🌍 Overall Campaign (All 50 Levels)
        </Button>
        <Button
          variant={activeTab === 'level' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('level')}
        >
          🎯 Level-Specific Standings
        </Button>

        {activeTab === 'level' && (
          <div className="level-select-inline">
            <label htmlFor="level-picker">Level:</label>
            <select
              id="level-picker"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="level-select-dropdown"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>
                  Level #{lvl}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Cloud Info Banner */}
      <div className="sample-data-notice">
        <span>
          ⚡ Authoritative leaderboard computed via MongoDB aggregation &bull; Tie-breaking: Total Score &rarr; Stars &rarr; Levels Cleared
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="auth-error-banner" role="alert">
          <span>⚠️ {error}</span>
          <Button size="sm" variant="outline" onClick={fetchLeaderboard} style={{ marginLeft: '1rem' }}>
            Retry
          </Button>
        </div>
      )}

      {/* Leaderboard Table Card */}
      <Card className="leaderboard-table-card">
        {loading ? (
          <div className="empty-history-state">
            <span className="empty-icon animate-bounce">⏳</span>
            <p>Fetching real-time rankings from database...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-history-state">
            <span className="empty-icon">🌱</span>
            <h3>No Qualifying Scores Yet</h3>
            <p>
              {activeTab === 'global'
                ? 'Be the very first player to complete orchard levels and claim the #1 global rank!'
                : `No players have completed Level #${selectedLevel} yet. Be the first to conquer it!`}
            </p>
            <Link to="/levels">
              <Button size="sm" variant="primary" icon="▶️">
                Play Levels Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>{activeTab === 'global' ? 'Levels Cleared' : 'Moves Used'}</th>
                  <th>{activeTab === 'global' ? 'Total Stars' : 'Recorded Date'}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => {
                  const isCurrentPlayer = user && user.username === player.username;
                  const rankInfo = getRankBadge(player.rank);

                  return (
                    <tr
                      key={player.userId || player.rank}
                      className={`leaderboard-row ${isCurrentPlayer ? 'row--current-user' : ''}`}
                    >
                      <td className="rank-cell">
                        <span className="rank-badge-text" title={`Rank ${player.rank}`}>
                          {rankInfo.icon}
                        </span>
                      </td>
                      <td className="player-cell">
                        <div className="player-name-wrapper">
                          <span className="player-avatar-small">🐛</span>
                          <span className="player-name">{player.username}</span>
                          {isCurrentPlayer && <Badge variant="gold" size="sm">You</Badge>}
                        </div>
                      </td>
                      <td className="score-cell">
                        <strong>{player.score !== undefined ? player.score.toLocaleString() : player.totalScore?.toLocaleString()}</strong> pts
                      </td>
                      <td>
                        {activeTab === 'global' ? (
                          <span>🏁 {player.completedLevelsCount} / 50</span>
                        ) : (
                          <span>👟 {player.movesUsed} moves</span>
                        )}
                      </td>
                      <td>
                        {activeTab === 'global' ? (
                          <span className="stars-pill">⭐ {player.starsEarned} / 150</span>
                        ) : (
                          <span className="table-date">
                            {new Date(player.recordedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
