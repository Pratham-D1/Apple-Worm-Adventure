// ==========================================
// Apple Worm Adventure - JWT Utility
// ==========================================

const jwt = require('jsonwebtoken');

/**
 * Generate a signed JSON Web Token (JWT)
 * @param {Object} user - Mongoose user document
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'apple_worm_default_dev_secret_2026';
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    secret,
    {
      expiresIn: '7d'
    }
  );
};

module.exports = generateToken;

