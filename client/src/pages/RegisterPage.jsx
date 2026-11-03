// ==========================================
// Apple Worm Adventure - Registration Page
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './pages.css';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register: authRegister, authError } = useAuth();
  const { login: gameLogin } = useGame();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setError('Username must be between 3 and 20 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authRegister(cleanUsername, cleanEmail, password);
      if (res.success && res.user) {
        // Sync local game state
        gameLogin(res.user.username, res.user.email);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Registration failed. Please try a different username or email.');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className="auth-page-container">
      <Card className="auth-card">
        <div className="auth-header">
          <span className="auth-icon animate-bounce">🐛</span>
          <h2>Join the Adventure</h2>
          <p className="auth-subtitle">Create a player profile to earn stars &amp; climb leaderboards</p>
        </div>

        {displayError && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️ {displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="reg-username">Player Username</label>
            <input
              id="reg-username"
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account & Start Playing'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in instead &rarr;
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
