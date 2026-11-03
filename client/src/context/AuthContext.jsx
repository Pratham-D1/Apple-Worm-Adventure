// ==========================================
// Apple Worm Adventure - Auth Context
// ==========================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('awa_token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('awa_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Verify token on initial app load with GET /api/auth/me
   */
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('awa_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('awa_auth_user', JSON.stringify(res.user));
      } else {
        throw new Error('Failed to verify user profile');
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      // Clean stale session
      localStorage.removeItem('awa_token');
      localStorage.removeItem('awa_auth_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Register a new player
   */
  const register = async (username, email, password) => {
    setAuthError(null);
    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });

      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('awa_token', res.token);
        localStorage.setItem('awa_auth_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Authenticate player / admin
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('awa_token', res.token);
        localStorage.setItem('awa_auth_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const errorMsg = err.message || 'Invalid email or password';
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Clear session & log out
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('awa_token');
    localStorage.removeItem('awa_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        authError,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

