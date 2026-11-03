// ==========================================
// Apple Worm Adventure - Backend Server
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB, getConnectionState } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const levelRoutes = require('./routes/levelRoutes');
const walletRoutes = require('./routes/walletRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const economyRoutes = require('./routes/economyRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Load environment variables from server/.env (robust across execution working directories)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URL = process.env.FRONTEND_URL || CLIENT_URL;
const GAME_NAME = process.env.GAME_NAME || 'APPLE WORM ADVENTURE';

// ------------------------------------------
// Middlewares
// ------------------------------------------

// Whitelisted CORS origins for production & local development
const allowedOrigins = [
  CLIENT_URL,
  FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173'
].filter(Boolean);

// Enable Cross-Origin Resource Sharing (resilient across local Vite dev, preview, and Vercel domains)
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server, uptime checks)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    const isVercelDomain = /\.vercel\.app$/.test(new URL(origin).hostname);
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isExplicitlyAllowed || isVercelDomain || isLocalhost || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not permitted by Apple Worm Adventure CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Simple request logger for development visibility
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ------------------------------------------
// Routes
// ------------------------------------------

// Root welcoming route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    game: GAME_NAME,
    message: 'Welcome to the Apple Worm Adventure API',
    version: '1.0.0',
    documentation: '/api/health for server status'
  });
});

// Health check endpoint with database connection status
app.get('/api/health', (req, res) => {
  const dbState = getConnectionState();

  res.status(200).json({
    status: 'ok',
    game: GAME_NAME,
    message: 'Apple Worm Adventure backend is healthy and running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbState.isConnected,
      state: dbState.stateDescription,
      name: dbState.name,
      host: dbState.host
    }
  });
});

// Authentication, Administration, Progress, Sessions, Wallet & Rewards Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// ------------------------------------------
// Error Handling
// ------------------------------------------

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ------------------------------------------
// Server Initialization
// ------------------------------------------
const startServer = async () => {
  // Connect to MongoDB Atlas (handles missing/placeholder configuration gracefully)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🍎 ${GAME_NAME} Server is running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Accepting CORS from: ${CLIENT_URL}`);
    console.log(`===============================================`);
  });
};

startServer();

module.exports = app;
