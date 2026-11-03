// ==========================================
// Apple Worm Adventure - Protected Route Guard
// ==========================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-guard-loading">
        <span className="guard-icon animate-bounce">🐛</span>
        <p>Verifying player authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, remember attempt path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

