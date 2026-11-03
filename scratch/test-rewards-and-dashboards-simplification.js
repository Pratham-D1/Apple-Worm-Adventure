// ==========================================
// Rewards & Dashboards Simplification Verification
// ==========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
  }
}

console.log('\n--- 1. Testing Simplified Rewards Dashboard (WalletPage.jsx) ---');
const walletPath = path.join(rootDir, 'client', 'src', 'pages', 'WalletPage.jsx');
const walletContent = fs.readFileSync(walletPath, 'utf8');

assert(walletContent.includes('<h1>Rewards</h1>'), 'Rewards page has clean <h1>Rewards</h1> heading');
assert(walletContent.includes('wallet-summary-card'), 'Rewards page uses compact wallet-summary-card');
assert(walletContent.includes('Active Balance'), 'Wallet summary card displays Active Balance');
assert(walletContent.includes('Total Earned'), 'Wallet summary card displays Total Earned');
assert(walletContent.includes('Total Spent'), 'Wallet summary card displays Total Spent');
assert(walletContent.includes('Daily Earn Cap'), 'Wallet summary card displays Daily Earn Cap with progress track');
assert(!walletContent.includes('wallet-coin-icon-large'), 'Removed oversized bouncing 4rem coin');
assert(walletContent.includes('boosters-grid'), 'Booster store uses boosters-grid');
assert(walletContent.includes('booster-card'), 'Booster store uses clean booster-card');
assert(walletContent.includes('earn-actions-grid'), 'Earn actions grid is present');
assert(walletContent.includes('handleClaimDailyBonus'), 'Daily bonus claim handler is preserved');
assert(walletContent.includes('handleBuyBooster'), 'Booster buy handler is preserved');
assert(walletContent.includes('startDemoAdSimulation'), 'Ad simulation handler is preserved');

console.log('\n--- 2. Testing Simplified Player Dashboard (DashboardPage.jsx) ---');
const dashPath = path.join(rootDir, 'client', 'src', 'pages', 'DashboardPage.jsx');
const dashContent = fs.readFileSync(dashPath, 'utf8');

assert(dashContent.includes('<h1>Dashboard</h1>'), 'Player dashboard has clean <h1>Dashboard</h1> heading');
assert(dashContent.includes('dashboard-header-card'), 'Profile banner is present');
assert(dashContent.includes('dash-play-btn'), 'Compact play button is present');
assert(dashContent.includes('dashboard-metrics-grid'), 'Metrics grid is present');
assert(dashContent.includes('metric-icon-box'), 'Metric icon boxes exist');
assert(dashContent.includes('dashboard-achievements-section'), 'Achievements section is present');

console.log('\n--- 3. Testing Simplified Leaderboard & Admin Panel ---');
const lbPath = path.join(rootDir, 'client', 'src', 'pages', 'LeaderboardPage.jsx');
const lbContent = fs.readFileSync(lbPath, 'utf8');

assert(lbContent.includes('<h1>Leaderboard</h1>'), 'Leaderboard has clean <h1>Leaderboard</h1> heading');
assert(!lbContent.includes('page-icon animate-bounce'), 'Removed bouncing trophy icon in header');
assert(!lbContent.includes('Season 1 • Live Atlas Rankings'), 'Removed redundant badge clutter in header');
assert(lbContent.includes('leaderboard-filter-tabs'), 'Filter tabs are preserved');

const adminPath = path.join(rootDir, 'client', 'src', 'pages', 'AdminPage.jsx');
const adminContent = fs.readFileSync(adminPath, 'utf8');
assert(adminContent.includes('<h1>Admin Panel</h1>'), 'Admin panel has clean <h1>Admin Panel</h1> heading');
assert(adminContent.includes('dashboard-metrics-grid'), 'Admin metrics use symmetrical grid');

console.log('\n--- 4. Testing CSS Spacing & Unified Styling (pages.css) ---');
const cssPath = path.join(rootDir, 'client', 'src', 'pages', 'pages.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.wallet-page-container'), 'CSS defines .wallet-page-container');
assert(cssContent.includes('.wallet-summary-card'), 'CSS defines .wallet-summary-card');
assert(cssContent.includes('.boosters-grid'), 'CSS defines .boosters-grid');
assert(cssContent.includes('.booster-card'), 'CSS defines .booster-card');
assert(cssContent.includes('.dashboard-container'), 'CSS defines .dashboard-container');
assert(cssContent.includes('.dashboard-metrics-grid'), 'CSS defines .dashboard-metrics-grid');
assert(cssContent.includes('repeat(3, 1fr)'), 'CSS defines repeat(3, 1fr) for symmetrical 3x2 rows');
assert(cssContent.includes('.leaderboard-page-container'), 'CSS defines .leaderboard-page-container');
assert(cssContent.includes('.admin-page-container'), 'CSS defines .admin-page-container');

console.log(`\n========================================`);
console.log(`Total tests: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
console.log(`========================================\n`);

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}

