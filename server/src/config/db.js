// ==========================================
// Apple Worm Adventure - Database Configuration
// ==========================================

const mongoose = require('mongoose');

/**
 * Checks whether Mongoose is currently connected to MongoDB.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const stateCode = mongoose.connection.readyState;

  return {
    isConnected: stateCode === 1,
    readyState: stateCode,
    stateDescription: states[stateCode] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null
  };
};

/**
 * Connects to MongoDB Atlas using the connection string from environment variables.
 * Handles missing configuration and connection errors safely without crashing unhandled.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Validate presence of MONGODB_URI
  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not defined in server/.env.');
    console.warn('ℹ️  Please add your MongoDB Atlas connection string to server/.env to enable database features.');
    return false;
  }

  // Detect placeholder values before attempting connection
  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('example.mongodb.net')) {
    console.warn('⚠️  MONGODB_URI contains placeholder credentials (<username>, <password>, or example host).');
    console.warn('ℹ️  Update server/.env with your real MongoDB Atlas connection string when ready.');
    return false;
  }

  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    
    // Set connection options
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // Fast fail in 8 seconds if Atlas is unreachable
      dbName: process.env.DB_NAME || 'apple_worm_adventure'
    });

    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    console.error('Troubleshooting checklist:');
    console.error(' 1. Verify your database username and password in server/.env');
    console.error(' 2. Ensure your IP address is whitelisted in MongoDB Atlas Network Access');
    console.error(' 3. Confirm the database cluster is active and healthy');
    return false;
  }
};

// Listen for connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost / disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB connection re-established.');
});

module.exports = {
  connectDB,
  getConnectionState
};

