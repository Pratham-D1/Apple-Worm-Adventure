// ==========================================
// Apple Worm Adventure - Level Selection Page (50 Levels)
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Badge } from '../components/ui/Badge';
import { WORLDS_METADATA } from '../data/levelsData';
import './pages.css';

export const LevelSelectPage = () => {
  const { levels, fetchServerProgress } = useGame();
  const navigate = useNavigate();
  const [selectedWorld, setSelectedWorld] = useState('all');

  useEffect(() => {
    fetchServerProgress();
  }, [fetchServerProgress]);

  const getDifficultyVariant = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'easy';
      case 'medium': return 'medium';
      case 'hard': return 'hard';
      case 'expert': return 'expert';
      default: return 'default';
    }
  };

  // Filter levels based on selected world tab
  const filteredLevels = selectedWorld === 'all'
    ? levels
    : levels.filter((lvl) => lvl.world === parseInt(selectedWorld, 10));

  // Calculate campaign completion stats
  const totalCompleted = levels.filter((l) => l.isCompleted).length;
  const totalStars = levels.reduce((acc, l) => acc + (l.stars || 0), 0);
  const totalUnlocked = levels.filter((l) => l.isUnlocked).length;
  const maxStars = (levels.length || 50) * 3;

  return (
    <div className="levels-page-container">
      {/* 1. Page Heading */}
      <div className="page-header">
        <h1>Levels</h1>
        <p className="page-subtitle">
          Explore 50 puzzles across five unique worlds. Complete levels to unlock new challenges.
        </p>
      </div>

      {/* 2. Compact Campaign Progress Overview Bar */}
      <div className="campaign-summary-card">
        <div className="campaign-stat-item">
          <div className="stat-item-header">
            <span className="stat-item-label">Levels Completed</span>
            <span className="stat-item-value">
              {totalCompleted} <span className="stat-item-total">/ {levels.length}</span>
            </span>
          </div>
          <div className="stat-progress-track">
            <div
              className="stat-progress-fill stat-progress-fill--green"
              style={{ width: `${(totalCompleted / (levels.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="campaign-summary-divider" aria-hidden="true" />

        <div className="campaign-stat-item">
          <div className="stat-item-header">
            <span className="stat-item-label">Stars Earned</span>
            <span className="stat-item-value">
              <span className="stat-icon-amber">★</span> {totalStars}{' '}
              <span className="stat-item-total">/ {maxStars}</span>
            </span>
          </div>
          <div className="stat-progress-track">
            <div
              className="stat-progress-fill stat-progress-fill--amber"
              style={{ width: `${(totalStars / (maxStars || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="campaign-summary-divider" aria-hidden="true" />

        <div className="campaign-stat-item">
          <div className="stat-item-header">
            <span className="stat-item-label">Levels Unlocked</span>
            <span className="stat-item-value">
              <span className="stat-icon-cyan">🔓</span> {totalUnlocked}{' '}
              <span className="stat-item-total">/ {levels.length}</span>
            </span>
          </div>
          <div className="stat-progress-track">
            <div
              className="stat-progress-fill stat-progress-fill--cyan"
              style={{ width: `${(totalUnlocked / (levels.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Level Range Filter Navigation (1–10, 11–20, etc.) */}
      <div className="world-filter-wrapper">
        <div className="world-filter-tabs" role="tablist" aria-label="Filter levels by range">
          <button
            type="button"
            role="tab"
            aria-selected={selectedWorld === 'all'}
            className={`world-filter-pill ${selectedWorld === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedWorld('all')}
          >
            <span className="world-pill-title">All Levels</span>
          </button>
          {WORLDS_METADATA.map((world) => {
            const isSelected = selectedWorld === String(world.id);
            const rangeFormatted = world.levelRange.replace(/\s*-\s*/, '–');
            return (
              <button
                key={world.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`world-filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedWorld(String(world.id))}
              >
                <span className="world-pill-title">{rangeFormatted}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Levels Grid (4 Columns on Desktop) */}
      <div className="levels-grid">
        {filteredLevels.map((lvl) => {
          const isPlayable = lvl.isUnlocked;
          const levelNumPadded = String(lvl.levelNumber).padStart(2, '0');

          return (
            <div
              key={lvl.id}
              className={`level-card ${
                isPlayable ? 'level-card--unlocked' : 'level-card--locked'
              } ${lvl.isCompleted ? 'level-card--completed' : ''}`}
              onClick={() => {
                if (isPlayable) {
                  navigate(`/game/${lvl.id}`);
                }
              }}
              role={isPlayable ? 'button' : undefined}
              tabIndex={isPlayable ? 0 : -1}
              onKeyDown={(e) => {
                if (isPlayable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  navigate(`/game/${lvl.id}`);
                }
              }}
            >
              {/* Top Row: Level number, difficulty tag, lock icon if locked */}
              <div className="level-card-top">
                <span className="level-number-badge">LEVEL {levelNumPadded}</span>
                <div className="level-card-top-right">
                  <Badge variant={getDifficultyVariant(lvl.difficulty)} size="sm">
                    {lvl.difficulty}
                  </Badge>
                  {!isPlayable && (
                    <span className="level-lock-icon" title="Locked" aria-label="Locked">
                      🔒
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Section: Level title, apple & move metadata */}
              <div className="level-card-body">
                <h3 className="level-title" title={lvl.title}>
                  {lvl.title}
                </h3>
                <div className="level-meta">
                  <span className="level-meta-item">
                    🍎 {lvl.applesCount} {lvl.applesCount === 1 ? 'apple' : 'apples'}
                  </span>
                  <span className="level-meta-dot">·</span>
                  <span className="level-meta-item">
                    👟 {lvl.maxMoves} moves
                  </span>
                </div>
              </div>

              {/* Bottom Section: Stars (★★★), best score, primary action button */}
              <div className="level-card-footer">
                <div className="level-stats-row">
                  <div
                    className="level-stars-display"
                    aria-label={`${lvl.stars || 0} out of 3 stars`}
                  >
                    {[1, 2, 3].map((starIdx) => (
                      <span
                        key={starIdx}
                        className={`star-symbol ${
                          starIdx <= (lvl.stars || 0) ? 'star-filled' : 'star-empty'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <div className="level-high-score">
                    {lvl.highScore > 0 ? (
                      <span title={`Best score: ${lvl.highScore}`}>🏆 {lvl.highScore}</span>
                    ) : (
                      <span className="score-unplayed" title="No score yet">—</span>
                    )}
                  </div>
                </div>

                <div className="level-card-action">
                  {isPlayable ? (
                    <button
                      type="button"
                      className={`level-action-btn ${
                        lvl.isCompleted ? 'level-action-btn--replay' : 'level-action-btn--play'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game/${lvl.id}`);
                      }}
                    >
                      {lvl.isCompleted ? 'REPLAY →' : 'PLAY →'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="level-action-btn level-action-btn--locked"
                      disabled
                      aria-disabled="true"
                    >
                      🔒 LOCKED
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
