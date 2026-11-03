// ==========================================
// Apple Worm Adventure - Home Page
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import './pages.css';

export const HomePage = () => {
  const { user, levels, fetchServerProgress } = useGame();
  const navigate = useNavigate();

  // Active expanded card for mobile tap & keyboard navigation
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    fetchServerProgress();
  }, [fetchServerProgress]);

  // Find next playable unlocked level
  const nextPlayableLevel = levels.find(l => l.isUnlocked && !l.isCompleted) || levels[0];

  // Mobile tap and keyboard toggle handler
  const toggleCard = (cardKey) => {
    setExpandedCard(prev => (prev === cardKey ? null : cardKey));
  };

  const handleCardKeyDown = (cardKey, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      e.preventDefault();
      toggleCard(cardKey);
    }
  };

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-brand-emblem animate-bounce">
          <span className="emblem-apple">🍎</span>
          <span className="emblem-worm">🐛</span>
        </div>

        <h1 className="home-hero-title">
          APPLE WORM <br />
          <span className="text-gradient-green">ADVENTURE</span>
        </h1>

        {/* Primary Action Group */}
        <div className="home-action-buttons">
          <Button
            size="lg"
            variant="primary"
            icon="▶️"
            className="home-play-btn"
            onClick={() => navigate(`/game/${nextPlayableLevel.id}`)}
          >
            PLAY LEVEL {nextPlayableLevel.levelNumber}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            icon="🗺️"
            onClick={() => navigate('/levels')}
          >
            LEVEL SELECT
          </Button>
        </div>

        {/* Quick Nav Pill Row */}
        <div className="home-quick-links">
          <Button variant="outline" size="sm" icon="🏆" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="outline" size="sm" icon="🪙" onClick={() => navigate('/wallet')}>
            Rewards Store
          </Button>
          <Button variant="outline" size="sm" icon="👤" onClick={() => navigate('/dashboard')}>
            Player Profile
          </Button>
          <Button variant="outline" size="sm" icon="⚙️" onClick={() => navigate('/admin')}>
            Admin Portal
          </Button>
        </div>
      </section>

      {/* Collapsible Dashboard Cards Grid */}
      <section className="home-features-grid" aria-label="Dashboard Quick Access Panels">
        {/* 1. Player Profile Card */}
        <Card
          className={`collapsible-card collapsible-card--profile ${expandedCard === 'profile' ? 'is-expanded' : ''}`}
          tabIndex={0}
          role="region"
          aria-expanded={expandedCard === 'profile'}
          aria-label="Player Profile Panel"
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            toggleCard('profile');
          }}
          onKeyDown={(e) => handleCardKeyDown('profile', e)}
          onMouseLeave={() => {
            if (expandedCard === 'profile') setExpandedCard(null);
          }}
        >
          <div className="collapsible-card-header">
            <div className="card-header-left">
              <span className="card-header-icon" aria-hidden="true">👤</span>
              <h3 className="card-header-title">Player Profile</h3>
            </div>
            <span className="card-expand-indicator" aria-hidden="true">▼</span>
          </div>

          <div className="card-collapsible-body">
            <div className="card-collapsible-inner">
              <div className="profile-card-header">
                <span className="profile-avatar">{user.avatar}</span>
                <div>
                  <h3 className="profile-username">{user.username}</h3>
                  <p className="profile-role">Adventurer Rank #6</p>
                </div>
              </div>

              <div className="profile-stats-row">
                <div className="p-stat">
                  <span className="p-stat-val">🟡 {user.walletBalance}</span>
                  <span className="p-stat-lbl">Coins</span>
                </div>
                <div className="p-stat">
                  <span className="p-stat-val">⭐ {user.totalStars}</span>
                  <span className="p-stat-lbl">Stars</span>
                </div>
                <div className="p-stat">
                  <span className="p-stat-val">🏁 {user.completedLevelsCount}</span>
                  <span className="p-stat-lbl">Cleared</span>
                </div>
              </div>

              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard');
                }}
              >
                Open Player Dashboard &rarr;
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. How to Play Card */}
        <Card
          className={`collapsible-card collapsible-card--rules ${expandedCard === 'rules' ? 'is-expanded' : ''}`}
          tabIndex={0}
          role="region"
          aria-expanded={expandedCard === 'rules'}
          aria-label="How to Play Rules Panel"
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            toggleCard('rules');
          }}
          onKeyDown={(e) => handleCardKeyDown('rules', e)}
          onMouseLeave={() => {
            if (expandedCard === 'rules') setExpandedCard(null);
          }}
        >
          <div className="collapsible-card-header">
            <div className="card-header-left">
              <span className="card-header-icon" aria-hidden="true">🍎</span>
              <h3 className="card-header-title">How to Play</h3>
            </div>
            <span className="card-expand-indicator" aria-hidden="true">▼</span>
          </div>

          <div className="card-collapsible-body">
            <div className="card-collapsible-inner">
              <ul className="rules-list">
                <li>
                  <span className="rule-icon">🍎</span>
                  <span><strong>Eat Apples:</strong> Grow in length to bridge wide gaps and push blocks.</span>
                </li>
                <li>
                  <span className="rule-icon">🧱</span>
                  <span><strong>Mind the Obstacles:</strong> Plan moves carefully before sliding into spikes or falling.</span>
                </li>
                <li>
                  <span className="rule-icon">🌀</span>
                  <span><strong>Enter the Portal:</strong> Move the worm's head into the portal to complete the level.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 3. VELoop Rewards Card */}
        <Card
          className={`collapsible-card collapsible-card--rewards ${expandedCard === 'rewards' ? 'is-expanded' : ''}`}
          tabIndex={0}
          role="region"
          aria-expanded={expandedCard === 'rewards'}
          aria-label="VELoop Rewards Panel"
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            toggleCard('rewards');
          }}
          onKeyDown={(e) => handleCardKeyDown('rewards', e)}
          onMouseLeave={() => {
            if (expandedCard === 'rewards') setExpandedCard(null);
          }}
        >
          <div className="collapsible-card-header">
            <div className="card-header-left">
              <span className="card-header-icon" aria-hidden="true">🪙</span>
              <h3 className="card-header-title">VELoop Rewards</h3>
            </div>
            <span className="card-expand-indicator" aria-hidden="true">▼</span>
          </div>

          <div className="card-collapsible-body">
            <div className="card-collapsible-inner">
              <p className="rewards-teaser-text">
                Earn coins on every puzzle solved. Redeem boosters, revive tokens, and exclusive worm cosmetics!
              </p>
              <div className="teaser-items-preview">
                <span title="Revive Token">💖</span>
                <span title="Double Score">⚡</span>
                <span title="Smart Hint">💡</span>
                <span title="Golden Skin">✨</span>
              </div>
              <Button
                variant="gold"
                fullWidth
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/wallet');
                }}
              >
                Visit Rewards &amp; Wallet &rarr;
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

