// ==========================================
// Apple Worm Adventure - Auth Controller
// ==========================================

const bcrypt = require('bcryptjs');
const { User, PlayerProgress, Level } = require('../models');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new player account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.toLowerCase().trim();

    // 2. Validate format and lengths
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 3. Reject duplicate username or email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another'
      });
    }

    // 4. Hash password with bcrypt salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Create user - strictly enforce role 'player' and 0 wallet balance
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: 'player', // Users can NEVER register themselves as admins
      walletBalance: 0
    });

    // 6. Initialize PlayerProgress for the new player
    await PlayerProgress.create({
      user: user._id,
      unlockedLevels: [1],
      completedLevels: [],
      starsEarned: 0,
      bestScores: []
    });

    // 7. Issue JWT token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Apple Worm Adventure.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate player/admin & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email and explicitly select passwordHash
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Issue JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      walletBalance: req.user.walletBalance,
      createdAt: req.user.createdAt
    }
  });
};

/**
 * @desc    Get administrator overview metrics (Admin only)
 * @route   GET /api/admin/overview
 * @access  Private / Admin
 */
const getAdminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLevels = await Level.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const playerCount = await User.countDocuments({ role: 'player' });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email role walletBalance createdAt');

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalLevels,
        adminCount,
        playerCount
      },
      recentUsers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAdminOverview
};

