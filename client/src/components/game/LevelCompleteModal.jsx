// ==========================================
// Apple Worm Adventure - LevelCompleteModal Component (Phase 8)
// ==========================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import './game.css';

export const LevelCompleteModal = ({
  isOpen,
  onClose,
  levelNumber = 1,
  score = 1250,
  stars = 3,
  movesUsed = 12,
  coinsEarned = 80,
  sessionId = null,
  canDouble = true,
  onDoubleReward = null,
  newlyUnlockedAchievements = [],
  onNextLevel,
  onReplay,
  onLevelSelect
}) => {
  const [isDoubling, setIsDoubling] = useState(false);
  const [isDoubled, setIsDoubled] = useState(false);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [doubleError, setDoubleError] = useState(null);

  // Reset local doubling states whenever a new modal opens or sessionId changes
  useEffect(() => {
    setIsDoubled(false);
    setIsDoubling(false);
    setBonusCoins(0);
    setDoubleError(null);
  }, [sessionId, isOpen]);

  const handleDoubleRewardClick = async () => {
    if (!sessionId || !onDoubleReward || isDoubled || isDoubling) return;
    setIsDoubling(true);
    setDoubleError(null);

    try {
      const res = await onDoubleReward(sessionId);
      if (res && res.success) {
        setIsDoubled(true);
        setBonusCoins(res.bonusCoins || coinsEarned);
      } else {
        setDoubleError(res?.message || 'Could not double reward');
      }
    } catch (err) {
      setDoubleError(err.message || 'Double reward claim failed');
    } finally {
      setIsDoubling(false);
    }
  };

  const totalDisplayedCoins = isDoubled ? coinsEarned + bonusCoins : coinsEarned;

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseBtn className="victory-modal">
      <div className="victory-modal-content">
        <div className="victory-crown animate-bounce">🏆</div>
        <h2 className="victory-title">LEVEL COMPLETE!</h2>
        <p className="victory-subtitle">The worm reached the golden portal safely!</p>

        {/* Phase 9: Newly Unlocked Achievement Notification */}
        {newlyUnlockedAchievements && newlyUnlockedAchievements.length > 0 && (
          <div className="victory-achievement-banner animate-bounce">
            <span className="ach-notify-icon">🌟</span>
            <div className="ach-notify-text">
              <span className="ach-notify-badge">ACHIEVEMENT UNLOCKED!</span>
              <p className="ach-notify-names">
                {newlyUnlockedAchievements.map((a) => `${a.badgeIcon} ${a.name} (+${a.rewardAmount || 0} 🟡)`).join(' • ')}
              </p>
            </div>
          </div>
        )}

        {/* Star Rating Display */}
        <div className="victory-stars-row" aria-label={`${stars} out of 3 stars earned`}>
          {[1, 2, 3].map((starIndex) => (
            <span
              key={starIndex}
              className={`victory-star ${
                starIndex <= stars ? 'star-earned' : 'star-empty'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="victory-stats-box">
          <div className="victory-stat-item">
            <span className="stat-label">Level</span>
            <span className="stat-value">#{levelNumber}</span>
          </div>
          <div className="victory-stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="victory-stat-item">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{movesUsed}</span>
          </div>
          <div className="victory-stat-item highlight-coin">
            <span className="stat-label">Reward</span>
            <span className="stat-value">
              +{totalDisplayedCoins} 🟡
              {isDoubled && <span className="doubled-tag"> 2x</span>}
            </span>
          </div>
        </div>

        {/* Phase 8: 2x Double Reward Bonus Action */}
        <div className="victory-double-section">
          {isDoubled ? (
            <div className="doubled-success-banner">
              <span>✨ 2x Double Reward Claimed! (+{bonusCoins} Bonus Coins)</span>
            </div>
          ) : (
            <div className="double-reward-offer">
              <Button
                variant="warning"
                size="md"
                fullWidth
                disabled={!canDouble || !sessionId || isDoubling}
                onClick={handleDoubleRewardClick}
                className="double-reward-btn"
              >
                {isDoubling ? (
                  '⏳ Simulating Demo Ad...'
                ) : (
                  <>🎬 Double Reward to +{coinsEarned * 2} Coins (2x Bonus)</>
                )}
              </Button>
              <div className="demo-ad-subtext">
                <span>🎬 Demo Ad Simulation &bull; Provider-independent mock for VELoop evaluation</span>
              </div>
              {doubleError && (
                <div className="double-error-text">
                  ⚠️ {doubleError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="victory-actions">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon="🚀"
            onClick={onNextLevel}
          >
            Next Level
          </Button>

          <div className="victory-secondary-actions">
            <Button
              variant="outline"
              size="md"
              icon="🔄"
              onClick={onReplay}
            >
              Replay
            </Button>
            <Button
              variant="outline"
              size="md"
              icon="🗺️"
              onClick={onLevelSelect}
            >
              Levels
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

