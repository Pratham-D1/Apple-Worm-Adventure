// ==========================================
// Apple Worm Adventure - Admin Route Guard
// ==========================================

import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="auth-guard-loading">
        <span className="guard-icon animate-bounce">⚙️</span>
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="game-guard-container">
        <Card className="game-guard-card">
          <span className="guard-icon">🛡️</span>
          <h2>Administrator Access Required</h2>
          <p>
            You are signed in as <strong>{user?.username}</strong> with role <strong>"{user?.role}"</strong>.
            This section is restricted strictly to verified system administrators.
          </p>
          <div className="guard-actions">
            <Button variant="primary" size="md" icon="👤" onClick={() => navigate('/dashboard')}>
              Go to Player Dashboard
            </Button>
            <Button variant="outline" size="md" icon="🏡" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

