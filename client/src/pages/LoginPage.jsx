// ==========================================
// Apple Worm Adventure - Login Page
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './pages.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login: authLogin, authError } = useAuth();
  const { login: gameLogin } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email and password.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authLogin(email.trim(), password);
      if (res.success && res.user) {
        // Sync local game user state
        gameLogin(res.user.username, res.user.email);
        
        // Redirect to origin location (e.g. if redirected by ProtectedRoute) or /dashboard
        const destination = location.state?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
      } else {
        setError(res.message || 'Invalid email or password.');
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
          <span className="auth-icon animate-bounce">🍎</span>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to sync your high scores and VELoop coins</p>
        </div>

        {displayError && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️ {displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
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
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-extra-row">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <span className="forgot-hint">🔒 JWT Secured</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Play'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link">
              Create an account &rarr;
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
