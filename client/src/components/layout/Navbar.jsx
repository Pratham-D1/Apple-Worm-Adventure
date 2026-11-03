// ==========================================
// Apple Worm Adventure - Navbar Component
// ==========================================

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import './layout.css';

export const Navbar = () => {
  const { user: authUser, isAuthenticated, isAdmin, logout: authLogout } = useAuth();
  const { user: gameUser, logout: gameLogout } = useGame();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    authLogout();
    gameLogout();
    closeMobileMenu();
    navigate('/login');
  };

  const displayedUsername = authUser?.username || gameUser?.username || 'Player';

  return (
    <header className="game-navbar">
      <div className="container navbar-inner">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="navbar-logo-icon">🍎🐛</span>
          <div className="navbar-brand-text">
            <span className="navbar-title">APPLE WORM</span>
            <span className="navbar-subtitle">ADVENTURE</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/levels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Levels
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Leaderboard
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Rewards
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right Status Area (Auth) */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-profile-widget">
              <Link to="/dashboard" className="user-avatar-btn" title="View Player Profile">
                <span className="avatar-emoji">{gameUser?.avatar || '🐛'}</span>
                <span className="user-name-label">{displayedUsername}</span>
                {isAdmin && <span style={{ fontSize: '0.75rem', background: '#ffebee', color: '#c62828', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '800' }}>ADMIN</span>}
              </Link>
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                title="Log out of your account"
                aria-label="Log out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button size="sm" variant="primary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Mobile Navigation">
          <div className="container mobile-links-list">
            <NavLink to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
              🏡 Home
            </NavLink>
            <NavLink to="/levels" className="mobile-nav-link" onClick={closeMobileMenu}>
              🗺️ Levels
            </NavLink>
            <NavLink to="/leaderboard" className="mobile-nav-link" onClick={closeMobileMenu}>
              🏆 Leaderboard
            </NavLink>
            <NavLink to="/wallet" className="mobile-nav-link" onClick={closeMobileMenu}>
              🪙 Rewards &amp; Wallet
            </NavLink>
            <NavLink to="/dashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
              👤 Player Dashboard
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className="mobile-nav-link" onClick={closeMobileMenu}>
                ⚙️ Admin Dashboard
              </NavLink>
            )}

            <div className="mobile-auth-section">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleLogout}
                >
                  Log Out ({displayedUsername})
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <Button fullWidth variant="outline" onClick={() => { navigate('/login'); closeMobileMenu(); }}>
                    Log In
                  </Button>
                  <Button fullWidth variant="primary" onClick={() => { navigate('/register'); closeMobileMenu(); }}>
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
