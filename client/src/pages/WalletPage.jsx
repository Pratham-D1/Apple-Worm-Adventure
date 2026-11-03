// ==========================================
// Apple Worm Adventure - Wallet & Rewards Page (Phase 8 - Simplified)
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { apiRequest } from '../config/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Link } from 'react-router-dom';
import './pages.css';

const BOOSTER_STORE = [
  {
    id: 'extra_moves',
    inventoryKey: 'extraMoves',
    priceKey: 'extraMoves',
    title: 'Extra Moves (+5)',
    icon: '👟',
    description: 'Grant 5 additional moves in a level to navigate tricky obstacles and reach the portal.'
  },
  {
    id: 'smart_hint',
    inventoryKey: 'smartHints',
    priceKey: 'smartHints',
    title: 'Smart Hint',
    icon: '💡',
    description: 'Reveals recommended path markers to safely consume apples without getting trapped.'
  },
  {
    id: 'revive_token',
    inventoryKey: 'reviveTokens',
    priceKey: 'reviveTokens',
    title: 'Revive Token',
    icon: '💖',
    description: 'Instantly rewind out of a lethal dead-end or trap state without restarting.'
  },
  {
    id: 'double_score',
    inventoryKey: 'doubleScoreBoosts',
    priceKey: 'doubleScoreBoosts',
    title: 'Double Score Boost',
    icon: '⭐',
    description: 'Multiplies your final level victory score by 2x for competitive leaderboard rankings.'
  }
];

export const WalletPage = () => {
  const { isAuthenticated } = useAuth();
  const { user, spendCoins, claimRewardAction, fetchServerProgress } = useGame();

  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Daily claim & Booster purchase states
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [purchasingId, setPurchasingId] = useState(null);

  // Mock Ad Simulator Modal states
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(3);
  const [adFinished, setAdFinished] = useState(false);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  /**
   * Fetch authenticated wallet overview and ledger transactions
   */
  const loadWalletInfo = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const [walletRes, txRes] = await Promise.all([
        apiRequest('/wallet/me'),
        apiRequest('/wallet/transactions?limit=25')
      ]);

      if (walletRes.success) {
        setWalletData(walletRes.wallet);
      }
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.warn('Failed to load wallet details:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  /**
   * Claim Daily Login Bonus
   */
  const handleClaimDailyBonus = async () => {
    if (!isAuthenticated || isClaimingDaily) return;
    setIsClaimingDaily(true);

    try {
      const res = await claimRewardAction('daily_bonus');
      if (res.success) {
        showToast(`🎉 Daily login bonus claimed! +${res.reward?.amount || 25} Coins credited.`);
        await loadWalletInfo();
        fetchServerProgress();
      } else {
        showToast(res.message || 'Daily bonus already claimed today.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to claim daily bonus.', 'error');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  /**
   * Start Demo Ad Simulation
   */
  const startDemoAdSimulation = () => {
    if (!isAuthenticated) return;
    setAdModalOpen(true);
    setAdCountdown(3);
    setAdFinished(false);
    setIsSimulatingAd(true);
  };

  /**
   * Run 3-second simulation countdown timer
   */
  useEffect(() => {
    let timer = null;
    if (adModalOpen && isSimulatingAd && adCountdown > 0) {
      timer = setTimeout(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
    } else if (adModalOpen && isSimulatingAd && adCountdown === 0) {
      setIsSimulatingAd(false);
      setAdFinished(true);
    }
    return () => clearTimeout(timer);
  }, [adModalOpen, isSimulatingAd, adCountdown]);

  /**
   * Finalize mock ad reward claim after simulation completion
   */
  const handleCompleteAdClaim = async () => {
    try {
      const res = await claimRewardAction('mock_ad');
      if (res.success) {
        showToast(`🎬 Demo Ad completed! +${res.reward?.amount || 30} Coins credited.`);
        await loadWalletInfo();
        fetchServerProgress();
      } else {
        showToast(res.message || 'Could not claim simulated ad reward.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Simulated ad claim failed.', 'error');
    } finally {
      setAdModalOpen(false);
      setAdFinished(false);
    }
  };

  /**
   * Spend coins to purchase booster
   */
  const handleBuyBooster = async (booster) => {
    if (!isAuthenticated) {
      showToast('Please log in or create an account to purchase boosters.', 'error');
      return;
    }

    const price = walletData?.boosterPrices?.[booster.priceKey] || 40;
    const currentBalance = walletData?.walletBalance ?? user.walletBalance;

    if (currentBalance < price) {
      showToast(`Insufficient coins! You need ${price} coins for ${booster.title}.`, 'error');
      return;
    }

    setPurchasingId(booster.id);
    try {
      const res = await spendCoins(booster.id);
      if (res.success) {
        showToast(`🛍️ Purchased ${booster.title}! -${price} Coins.`);
        await loadWalletInfo();
        fetchServerProgress();
      } else {
        showToast(res.message || 'Failed to complete booster purchase.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Booster purchase failed.', 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  // Filtered transactions list
  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'EARN') return tx.coinAmount > 0;
    if (txFilter === 'SPEND') return tx.coinAmount < 0;
    return true;
  });

  const liveBalance = walletData?.walletBalance ?? user.walletBalance ?? 0;
  const totalEarned = walletData?.totalEarned ?? 0;
  const totalSpent = walletData?.totalSpent ?? 0;
  const earnedToday = walletData?.earnedToday ?? 0;
  const dailyEarningLimit = walletData?.dailyEarningLimit ?? 500;
  const dailyPercentage = Math.min(100, Math.round((earnedToday / dailyEarningLimit) * 100));

  const dailyBonusAvailable = walletData?.dailyBonus?.available ?? true;
  const dailyBonusAmount = walletData?.dailyBonus?.amount ?? 25;

  const mockAdDailyLimit = walletData?.mockAd?.dailyLimit ?? 5;
  const mockAdRemaining = walletData?.mockAd?.remainingToday ?? 5;
  const mockAdAmount = walletData?.mockAd?.amount ?? 30;
  const canWatchMockAd = walletData?.mockAd?.available ?? (mockAdRemaining > 0);

  const inventory = walletData?.inventory || user.inventory || {
    extraMoves: 0,
    smartHints: 0,
    reviveTokens: 0,
    doubleScoreBoosts: 0
  };

  return (
    <div className="wallet-page-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`wallet-toast-banner ${
            toastMessage.type === 'error' ? 'toast-error' : 'toast-success'
          }`}
          role="status"
        >
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'} {toastMessage.text}</span>
        </div>
      )}

      {/* 1. Page Heading */}
      <div className="page-header">
        <h1>Rewards</h1>
        <p className="page-subtitle">
          Earn coins through gameplay, claim daily rewards, and purchase in-game power-up boosters.
        </p>
      </div>

      {/* Guest Mode Warning Banner */}
      {!isAuthenticated && (
        <div className="guest-wallet-banner">
          <div className="guest-banner-icon">👤</div>
          <div className="guest-banner-text">
            <h4>Guest Session Mode</h4>
            <p>
              Log in to sync your coin earnings, claim daily login bonuses, and keep your power-ups safely stored.
            </p>
          </div>
          <div className="guest-banner-actions">
            <Link to="/login">
              <Button variant="primary" size="sm">Log In</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="sm">Register</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Compact Wallet Overview Card (Matches Levels Campaign Bar) */}
      <div className="wallet-summary-card">
        <div className="wallet-stat-item wallet-stat-item--primary">
          <span className="wallet-stat-label">Active Balance</span>
          <div className="wallet-stat-value-group">
            <span className="wallet-stat-coin">🟡</span>
            <span className="wallet-stat-amount">{liveBalance.toLocaleString()}</span>
            <span className="wallet-stat-unit">Coins</span>
          </div>
        </div>

        <div className="campaign-summary-divider" aria-hidden="true" />

        <div className="wallet-stat-item">
          <span className="wallet-stat-label">Total Earned</span>
          <span className="wallet-stat-value text-green">+{totalEarned.toLocaleString()} 🟡</span>
        </div>

        <div className="campaign-summary-divider" aria-hidden="true" />

        <div className="wallet-stat-item">
          <span className="wallet-stat-label">Total Spent</span>
          <span className="wallet-stat-value text-red">-{totalSpent.toLocaleString()} 🟡</span>
        </div>

        <div className="campaign-summary-divider" aria-hidden="true" />

        <div className="wallet-stat-item wallet-stat-item--progress">
          <div className="stat-item-header">
            <span className="wallet-stat-label">Daily Earn Cap</span>
            <span className="wallet-stat-cap-text">{earnedToday} / {dailyEarningLimit}</span>
          </div>
          <div className="stat-progress-track">
            <div
              className="stat-progress-fill stat-progress-fill--amber"
              style={{ width: `${dailyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Earn Bonus Coins: Daily Bonus & Rewarded Ad */}
      <div className="section-title-row">
        <div>
          <h2>Earn Bonus Coins</h2>
          <p className="section-subtitle">
            Claim your daily bonus and view rewarded demo ads for extra coins.
          </p>
        </div>
      </div>

      <div className="earn-actions-grid">
        {/* Card 1: Daily Login Bonus */}
        <div className="earn-action-card">
          <div className="earn-card-top">
            <span className="earn-card-icon">🎁</span>
            <Badge variant={dailyBonusAvailable ? 'gold' : 'default'} size="sm">
              {dailyBonusAvailable ? 'Available' : 'Claimed Today'}
            </Badge>
          </div>
          <div className="earn-card-body">
            <h3>Daily Login Bonus</h3>
            <p>Log in every day to claim your free reward bonus.</p>
            <div className="earn-reward-badge">+{dailyBonusAmount} 🟡 Coins</div>
          </div>
          <div className="earn-card-footer">
            <button
              type="button"
              className={`earn-btn ${dailyBonusAvailable && isAuthenticated ? 'earn-btn--active' : 'earn-btn--disabled'}`}
              disabled={!dailyBonusAvailable || isClaimingDaily || !isAuthenticated}
              onClick={handleClaimDailyBonus}
            >
              {isClaimingDaily
                ? 'Claiming...'
                : dailyBonusAvailable
                ? `Claim +${dailyBonusAmount} Coins`
                : 'Claimed Today ✅'}
            </button>
          </div>
        </div>

        {/* Card 2: Rewarded Demo Ad Simulation */}
        <div className="earn-action-card">
          <div className="earn-card-top">
            <span className="earn-card-icon">🎬</span>
            <Badge variant="default" size="sm">
              {mockAdRemaining > 0 ? `${mockAdRemaining}/${mockAdDailyLimit} Remaining` : 'Limit Reached'}
            </Badge>
          </div>
          <div className="earn-card-body">
            <h3>Rewarded Demo Ad</h3>
            <p>Watch a short 3-second demo video to earn bonus coins.</p>
            <div className="earn-reward-badge">+{mockAdAmount} 🟡 Coins</div>
          </div>
          <div className="earn-card-footer">
            <button
              type="button"
              className={`earn-btn ${canWatchMockAd && isAuthenticated ? 'earn-btn--ad' : 'earn-btn--disabled'}`}
              disabled={!canWatchMockAd || !isAuthenticated}
              onClick={startDemoAdSimulation}
            >
              {mockAdRemaining <= 0
                ? 'Daily Limit Reached'
                : `Watch Demo Ad (+${mockAdAmount} Coins)`}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Booster & Power-Up Store Grid (4 Columns Desktop) */}
      <div className="section-title-row">
        <div>
          <h2>Power-Ups &amp; Boosters</h2>
          <p className="section-subtitle">
            Spend earned coins on game boosters to solve challenging puzzles.
          </p>
        </div>
      </div>

      <div className="boosters-grid">
        {BOOSTER_STORE.map((booster) => {
          const price = walletData?.boosterPrices?.[booster.priceKey] || 40;
          const ownedCount = inventory[booster.inventoryKey] || 0;
          const canAfford = liveBalance >= price;
          const isBuying = purchasingId === booster.id;

          return (
            <div key={booster.id} className="booster-card">
              <div className="booster-card-top">
                <span className="booster-icon">{booster.icon}</span>
                <span className="booster-owned-badge">Owned: {ownedCount}</span>
              </div>

              <div className="booster-card-body">
                <h3 className="booster-title">{booster.title}</h3>
                <p className="booster-desc">{booster.description}</p>
              </div>

              <div className="booster-card-footer">
                <div className="booster-price">
                  <span className="price-coin">🟡</span>
                  <span className="price-value">{price}</span>
                  <span className="price-label">Coins</span>
                </div>

                <button
                  type="button"
                  className={`booster-buy-btn ${canAfford ? 'booster-buy-btn--active' : 'booster-buy-btn--disabled'}`}
                  disabled={!canAfford || isBuying || !isAuthenticated}
                  onClick={() => handleBuyBooster(booster)}
                >
                  {isBuying
                    ? 'BUYING...'
                    : canAfford
                    ? 'BUY BOOSTER'
                    : 'NEED COINS'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Transaction History Ledger Section */}
      <div className="dashboard-history-section">
        <div className="section-title-row">
          <div>
            <h2>Transaction Ledger</h2>
            <p className="section-subtitle">
              Audit trail of every coin earning and booster purchase.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="tx-filter-pills">
            <button
              type="button"
              className={`world-filter-pill ${txFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTxFilter('all')}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              className={`world-filter-pill ${txFilter === 'EARN' ? 'active' : ''}`}
              onClick={() => setTxFilter('EARN')}
            >
              Earnings (+)
            </button>
            <button
              type="button"
              className={`world-filter-pill ${txFilter === 'SPEND' ? 'active' : ''}`}
              onClick={() => setTxFilter('SPEND')}
            >
              Spendings (-)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-history-state">
            <span className="empty-icon animate-bounce">⏳</span>
            <p>Loading ledger transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-history-state">
            <span className="empty-icon">📜</span>
            <p>No transaction history recorded yet. Complete puzzle levels to earn coins!</p>
            <Link to="/levels">
              <Button variant="primary" size="sm">Play Levels</Button>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Activity / Reason</th>
                  <th>Type</th>
                  <th>Coins</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.coinAmount > 0;
                  return (
                    <tr key={tx.id || tx._id}>
                      <td className="table-date">
                        {new Date(tx.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <strong>{tx.reason}</strong>
                        {tx.rewardSource && (
                          <span className="table-subtext">
                            Source: {tx.rewardSource.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            tx.transactionType === 'EARN'
                              ? 'success'
                              : tx.transactionType === 'SPEND'
                              ? 'danger'
                              : 'gold'
                          }
                          size="sm"
                        >
                          {tx.transactionType}
                        </Badge>
                      </td>
                      <td className={isPositive ? 'tx-amount-positive' : 'tx-amount-negative'}>
                        {isPositive ? `+${tx.coinAmount}` : `${tx.coinAmount}`} 🟡
                      </td>
                      <td className="tx-balance-after">
                        {tx.balanceAfter !== undefined ? `${tx.balanceAfter} 🟡` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Demo Ad Simulator Modal */}
      <Modal
        isOpen={adModalOpen}
        onClose={() => {
          if (!isSimulatingAd) {
            setAdModalOpen(false);
          }
        }}
        hideCloseBtn={isSimulatingAd}
        className="demo-ad-modal"
      >
        <div className="demo-ad-modal-content">
          <div className="demo-ad-header">
            <Badge variant="warning" size="md">
              🎬 Rewarded Ad Simulator
            </Badge>
          </div>

          <div className="demo-ad-player">
            <div className="demo-ad-screen">
              <div className="demo-ad-brand">
                <span className="demo-ad-logo">🍎</span>
                <h3>Apple Worm Adventure</h3>
                <p>Puzzle progression &amp; rewards</p>
              </div>

              {isSimulatingAd ? (
                <div className="demo-ad-countdown-box">
                  <div className="countdown-ring animate-bounce">
                    <span>{adCountdown}</span>
                  </div>
                  <p className="countdown-text">
                    Simulating ad playback... {adCountdown}s remaining
                  </p>
                  <div className="ad-sim-progress-track">
                    <div
                      className="ad-sim-progress-bar"
                      style={{ width: `${((3 - adCountdown) / 3) * 100}%` }}
                    />
                  </div>
                </div>
              ) : adFinished ? (
                <div className="demo-ad-completed-box">
                  <span className="completed-check">✅</span>
                  <h4>Simulation Complete!</h4>
                  <p>Eligible for +{mockAdAmount} Coins bonus.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="demo-ad-footer">
            {adFinished ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCompleteAdClaim}
              >
                ✨ Collect +{mockAdAmount} Bonus Coins
              </Button>
            ) : (
              <Button variant="outline" size="md" fullWidth disabled>
                ⏳ Watching ad ({adCountdown}s)...
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
