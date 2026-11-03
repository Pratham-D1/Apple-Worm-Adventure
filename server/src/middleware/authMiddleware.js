// ==========================================
// Apple Worm Adventure - Auth Middleware
// ==========================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Protect routes - Verifies JWT from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'apple_worm_default_dev_secret_2026';
      const decoded = jwt.verify(token, secret);

      // Find user by ID, exclude password hash
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User account no longer exists'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Token is invalid or has expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided'
    });
  }
};

/**
 * Authorize Administrator role
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required'
  });
};

module.exports = {
  protect,
  verifyToken: protect,
  requireAdmin
};

