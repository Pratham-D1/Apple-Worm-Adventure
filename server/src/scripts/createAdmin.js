// ==========================================
// Apple Worm Adventure - Secure First Administrator CLI Script
// ==========================================

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { connectDB } = require('../config/db');
const { User, PlayerProgress } = require('../models');

async function createOrPromoteAdmin() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : 'help';

  console.log('🛡️ Apple Worm Adventure - Administrator Provisioning Tool');
  console.log('---------------------------------------------------------');

  try {
    await connectDB();

    if (command === 'promote') {
      const identifier = args[1];
      if (!identifier) {
        console.error('❌ Error: Missing email or username to promote.');
        console.log('Usage: node src/scripts/createAdmin.js promote <email_or_username>');
        process.exit(1);
      }

      const user = await User.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
      });

      if (!user) {
        console.error(`❌ User not found with identifier: "${identifier}"`);
        process.exit(1);
      }

      if (user.role === 'admin') {
        console.log(`ℹ️ User "${user.username}" (${user.email}) is already an Administrator.`);
        process.exit(0);
      }

      user.role = 'admin';
      await user.save();

      console.log(`✅ Success: User "${user.username}" (${user.email}) has been elevated to role: "admin"!`);
      process.exit(0);
    } else if (command === 'create') {
      const username = args[1] || process.env.ADMIN_USERNAME || 'AppleAdmin';
      const email = (args[2] || process.env.ADMIN_EMAIL || 'admin@appleworm.dev').toLowerCase();
      const password = args[3] || process.env.ADMIN_PASSWORD || 'AdminPassword123!';

      if (!username || !email || !password) {
        console.error('❌ Error: Missing parameters.');
        console.log('Usage: node src/scripts/createAdmin.js create <username> <email> <password>');
        process.exit(1);
      }

      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        if (existingUser.role !== 'admin') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log(`ℹ️ User "${existingUser.username}" existed and was promoted to Administrator.`);
        } else {
          console.log(`ℹ️ User "${existingUser.username}" already exists as an Administrator.`);
        }
        process.exit(0);
      }

      // Hash password securely with bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newAdmin = await User.create({
        username,
        email,
        passwordHash,
        role: 'admin',
        walletBalance: 200,
        inventory: {
          extraMoves: 2,
          smartHints: 2,
          reviveTokens: 2,
          doubleScoreBoosts: 2
        }
      });

      // Provision linked PlayerProgress document
      await PlayerProgress.create({
        user: newAdmin._id,
        unlockedLevels: [1],
        completedLevels: [],
        starsEarned: 0,
        totalScore: 0,
        totalGamesPlayed: 0
      });

      console.log('========================================================');
      console.log('🎉 Administrator Account Created Successfully!');
      console.log(`👤 Username: ${newAdmin.username}`);
      console.log(`📧 Email:    ${newAdmin.email}`);
      console.log(`🛡️ Role:     ${newAdmin.role}`);
      console.log('🔒 Password has been hashed with bcrypt and saved to Atlas.');
      console.log('========================================================');
      process.exit(0);
    } else {
      console.log('Usage:');
      console.log('  1. Promote existing user:');
      console.log('     node src/scripts/createAdmin.js promote <email_or_username>');
      console.log('  2. Create brand new administrator:');
      console.log('     node src/scripts/createAdmin.js create <username> <email> <password>');
      console.log('  Or run with environment variables: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Fatal error in createAdmin:', err);
    process.exit(1);
  }
}

createOrPromoteAdmin();

