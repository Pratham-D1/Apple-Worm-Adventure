// ==========================================
// Phase 10: Complete Audit & Verification Test Suite
// ==========================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('🧪 APPLE WORM ADVENTURE - PHASE 10 AUDIT & VERIFICATION');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// 1. Audit All 50 Levels
// ----------------------------------------------------
const levelsDataPath = path.resolve(__dirname, '../server/src/config/levelsData.json');
runTest('50 Levels Dataset Exists and has exactly 50 entries', () => {
  assert(fs.existsSync(levelsDataPath), 'levelsData.json should exist');
  const data = JSON.parse(fs.readFileSync(levelsDataPath, 'utf8'));
  assert.strictEqual(data.length, 50, `Expected 50 levels, got ${data.length}`);
});

runTest('All 50 Levels have valid structure, positive moves, and correct worlds', () => {
  const data = JSON.parse(fs.readFileSync(levelsDataPath, 'utf8'));
  const validWorlds = [
    'Sunny Orchard',
    'Stone Hollows',
    'Bramble Valley',
    'Gravity Caverns',
    "King's Citadel"
  ];

  data.forEach((lvl, idx) => {
    assert.strictEqual(lvl.levelNumber, idx + 1, `Level index mismatch at ${lvl.levelNumber}`);
    assert(lvl.title && typeof lvl.title === 'string', `Level ${lvl.levelNumber} missing title`);
    assert(validWorlds.includes(lvl.worldName), `Invalid worldName "${lvl.worldName}" in level ${lvl.levelNumber}`);
    assert(lvl.world >= 1 && lvl.world <= 5, `Invalid world number ${lvl.world} in level ${lvl.levelNumber}`);
    assert(lvl.grid && lvl.grid.width >= 5 && lvl.grid.height >= 5, `Invalid grid in level ${lvl.levelNumber}`);
    assert(lvl.startingPosition && lvl.startingPosition.length >= 2, `Invalid startingPosition in level ${lvl.levelNumber}`);
    assert(Array.isArray(lvl.applePositions || lvl.apples), `Invalid applePositions in level ${lvl.levelNumber}`);
    assert(lvl.portalPosition && typeof lvl.portalPosition.x === 'number', `Invalid portalPosition in level ${lvl.levelNumber}`);
    assert(lvl.maxMoves >= 10, `Moves too low (${lvl.maxMoves}) in level ${lvl.levelNumber}`);
    assert(['easy', 'medium', 'hard', 'expert'].includes(lvl.difficulty.toLowerCase()), `Invalid difficulty in level ${lvl.levelNumber}`);
  });
});

// ----------------------------------------------------
// 2. Audit Client Components & Pages
// ----------------------------------------------------
runTest('All Core Frontend Pages and Components Exist', () => {
  const requiredFiles = [
    'client/src/App.jsx',
    'client/src/main.jsx',
    'client/src/pages/HomePage.jsx',
    'client/src/pages/LevelSelectPage.jsx',
    'client/src/pages/GamePage.jsx',
    'client/src/pages/LeaderboardPage.jsx',
    'client/src/pages/WalletPage.jsx',
    'client/src/pages/DashboardPage.jsx',
    'client/src/pages/AdminPage.jsx',
    'client/src/pages/LoginPage.jsx',
    'client/src/pages/RegisterPage.jsx',
    'client/src/components/layout/Navbar.jsx',
    'client/src/components/layout/Footer.jsx',
    'client/src/context/AuthContext.jsx',
    'client/src/context/GameContext.jsx',
    'client/src/gameEngine/GameEngine.js',
    'client/src/gameEngine/useGameEngine.js',
    'client/src/gameEngine/solver.js',
    'client/src/gameEngine/soundEffects.js',
    'client/src/config/api.js'
  ];

  requiredFiles.forEach(file => {
    assert(fs.existsSync(path.resolve(__dirname, '..', file)), `Missing expected frontend file: ${file}`);
  });
});

// ----------------------------------------------------
// 3. Audit Backend Models, Routes, and Controllers
// ----------------------------------------------------
runTest('All 8 Mongoose Models Exist and are Exported', () => {
  const models = require('../server/src/models');
  assert(models.User, 'Missing User model');
  assert(models.PlayerProgress, 'Missing PlayerProgress model');
  assert(models.GameSession, 'Missing GameSession model');
  assert(models.Level, 'Missing Level model');
  assert(models.LeaderboardEntry, 'Missing LeaderboardEntry model');
  assert(models.RewardTransaction, 'Missing RewardTransaction model');
  assert(models.EconomyConfig, 'Missing EconomyConfig model');
  assert(models.Achievement, 'Missing Achievement model');
});

runTest('Auth Middleware and Admin Gatekeeping Exist', () => {
  const { verifyToken, requireAdmin } = require('../server/src/middleware/authMiddleware');
  assert.strictEqual(typeof verifyToken, 'function', 'verifyToken middleware must be a function');
  assert.strictEqual(typeof requireAdmin, 'function', 'requireAdmin middleware must be a function');
});

// ----------------------------------------------------
// 4. Audit Security Controls & Secret Exclusions
// ----------------------------------------------------
runTest('Environment templates do not contain sensitive secrets', () => {
  const envFiles = [
    '.env.example',
    'client/.env.example',
    'server/.env.example'
  ];

  envFiles.forEach(relPath => {
    const content = fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
    assert(!content.includes('password123') && !content.includes('prod_secret_key'), `Found suspicious value in ${relPath}`);
    assert(content.includes('<username>') || content.includes('replace_with') || content.includes('localhost'), `Expected placeholder in ${relPath}`);
  });
});

runTest('Root .gitignore excludes sensitive files and un-ignores templates', () => {
  const gitignore = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf8');
  assert(gitignore.includes('node_modules/'), 'gitignore must exclude node_modules');
  assert(gitignore.includes('.env'), 'gitignore must exclude .env');
  assert(gitignore.includes('dist/'), 'gitignore must exclude dist/');
  assert(gitignore.includes('!.env.example'), 'gitignore must whitelist .env.example');
});

// ----------------------------------------------------
// 5. Audit Vercel Deployment Configuration
// ----------------------------------------------------
runTest('Vercel SPA routing rewrite files exist in client/ and root', () => {
  const clientVercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client/vercel.json'), 'utf8'));
  assert(Array.isArray(clientVercel.rewrites), 'client/vercel.json must specify rewrites');
  assert.strictEqual(clientVercel.rewrites[0].destination, '/index.html');

  const rootVercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8'));
  assert(Array.isArray(rootVercel.rewrites), 'root vercel.json must specify rewrites');
  assert.strictEqual(rootVercel.rewrites[0].destination, '/index.html');
});

// ----------------------------------------------------
// 6. Audit Seed Script
// ----------------------------------------------------
runTest('Master seed script exists and is executable', () => {
  const seedScriptPath = path.resolve(__dirname, '../server/src/scripts/seedData.js');
  assert(fs.existsSync(seedScriptPath), 'seedData.js must exist');
  const content = fs.readFileSync(seedScriptPath, 'utf8');
  assert(content.includes('seedDemoData'), 'seedData.js must define seedDemoData');
  assert(content.includes('DemoPlayer'), 'seedData.js must seed demo player');
  assert(content.includes('AppleAdmin'), 'seedData.js must seed admin account');
});

console.log('\n========================================================');
console.log(`Summary: ${passedTests} / ${totalTests} Phase 10 Audit Tests Passed!`);
console.log('========================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
