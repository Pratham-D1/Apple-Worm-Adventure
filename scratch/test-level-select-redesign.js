// ==========================================
// Level Select Redesign Verification Script
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

console.log('\n--- 1. Testing Navbar Simplification ---');
const navbarPath = path.join(rootDir, 'client', 'src', 'components', 'layout', 'Navbar.jsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

assert(!navbarContent.includes('wallet-pill'), 'Navbar does not contain duplicate wallet-pill (coin counter)');
assert(navbarContent.includes('to="/wallet"'), 'Navbar retains Rewards link to /wallet');
assert(navbarContent.includes('to="/levels"'), 'Navbar retains Levels link');
assert(navbarContent.includes('to="/leaderboard"'), 'Navbar retains Leaderboard link');
assert(navbarContent.includes('to="/dashboard"'), 'Navbar retains Dashboard link');
assert(navbarContent.includes('APPLE WORM'), 'Navbar retains Apple Worm logo brand text');

console.log('\n--- 2. Testing LevelSelectPage Heading & Subtitle ---');
const levelSelectPath = path.join(rootDir, 'client', 'src', 'pages', 'LevelSelectPage.jsx');
const levelSelectContent = fs.readFileSync(levelSelectPath, 'utf8');

assert(levelSelectContent.includes('<h1>Levels</h1>'), 'Heading title is exactly "Levels"');
assert(!levelSelectContent.includes('&larr; Home'), 'No redundant "← Home" button to the left of Levels');
assert(
  levelSelectContent.includes(
    'Explore 50 puzzles across five unique worlds. Complete levels to unlock new challenges.'
  ),
  'Subtitle matches the exact prompt text'
);

console.log('\n--- 3. Testing Compact Campaign Progress Summary ---');
assert(levelSelectContent.includes('campaign-summary-card'), 'Campaign summary card element is present');
assert(levelSelectContent.includes('Levels Completed'), 'Displays "Levels Completed" label');
assert(levelSelectContent.includes('totalCompleted'), 'Dynamically computes totalCompleted');
assert(levelSelectContent.includes('Stars Earned'), 'Displays "Stars Earned" label');
assert(levelSelectContent.includes('totalStars'), 'Dynamically computes totalStars');
assert(levelSelectContent.includes('Levels Unlocked'), 'Displays "Levels Unlocked" label');
assert(levelSelectContent.includes('totalUnlocked'), 'Dynamically computes totalUnlocked');
assert(levelSelectContent.includes('stat-progress-track'), 'Progress track bar indicators exist');
assert(levelSelectContent.includes('stat-progress-fill--green'), 'Green progress bar for completed levels');
assert(levelSelectContent.includes('stat-progress-fill--amber'), 'Amber progress bar for stars');
assert(levelSelectContent.includes('stat-progress-fill--cyan'), 'Cyan progress bar for unlocked levels');

console.log('\n--- 4. Testing World Filter Navigation & Ranges ---');
assert(levelSelectContent.includes('world-filter-wrapper'), 'World filter wrapper container exists');
assert(levelSelectContent.includes('world-filter-tabs'), 'World filter tabs element exists');
assert(levelSelectContent.includes('All Levels'), 'All Levels tab is present');
assert(levelSelectContent.includes('rangeFormatted'), 'Filter tabs format ranges like 1–10, 11–20 etc.');
assert(!levelSelectContent.includes('world.name'), 'Filter tabs do not distinguish levels by world name');

console.log('\n--- 5. Testing Level Card Structure & Requirements ---');
assert(levelSelectContent.includes('LEVEL {levelNumPadded}'), 'Top row displays padded level number e.g. LEVEL 01');
assert(levelSelectContent.includes('Badge variant={getDifficultyVariant(lvl.difficulty)}'), 'Top row displays difficulty badge');
assert(levelSelectContent.includes('level-lock-icon'), 'Top row displays lock icon for locked levels');
assert(!levelSelectContent.includes('level-world-tag'), 'World name (e.g. Sunny Orchard) removed from level boxes');
assert(levelSelectContent.includes('level-title'), 'Middle section displays level title');
assert(levelSelectContent.includes('lvl.applesCount'), 'Middle section displays apple count');
assert(levelSelectContent.includes('lvl.maxMoves'), 'Middle section displays max moves');
assert(levelSelectContent.includes('level-stars-display'), 'Bottom section displays 3 stars');
assert(levelSelectContent.includes('level-high-score'), 'Bottom section displays best score');
assert(levelSelectContent.includes('PLAY →'), 'Action button displays PLAY → for unplayed unlocked levels');
assert(levelSelectContent.includes('REPLAY →'), 'Action button displays REPLAY → for completed levels');
assert(levelSelectContent.includes('🔒 LOCKED'), 'Action button displays 🔒 LOCKED for locked levels');

console.log('\n--- 6. Testing CSS Grid & Visual Styling ---');
const pagesCssPath = path.join(rootDir, 'client', 'src', 'pages', 'pages.css');
const pagesCssContent = fs.readFileSync(pagesCssPath, 'utf8');

assert(pagesCssContent.includes('padding-top: 2rem'), 'levels-page-container has generous padding-top gap below navbar');
assert(pagesCssContent.includes('repeat(4, 1fr)'), 'CSS Grid specifies repeat(4, 1fr) for 4 columns on desktop');
assert(pagesCssContent.includes('repeat(3, 1fr)'), 'CSS Grid specifies repeat(3, 1fr) on tablets');
assert(pagesCssContent.includes('repeat(2, 1fr)'), 'CSS Grid specifies repeat(2, 1fr) on smaller screens');
assert(pagesCssContent.includes('world-filter-wrapper'), 'CSS has world-filter-wrapper with horizontal scrolling');
assert(pagesCssContent.includes('overflow-x: auto'), 'world-filter-wrapper has overflow-x: auto');
assert(pagesCssContent.includes('.level-card'), 'CSS has .level-card styling');
assert(pagesCssContent.includes('background: #0a1022'), 'Level card uses dark navy background #0a1022');
assert(pagesCssContent.includes('border: 1px solid #1a263f'), 'Level card uses subtle blue-gray border #1a263f');
assert(pagesCssContent.includes('.level-action-btn--play'), 'CSS has .level-action-btn--play styling');
assert(pagesCssContent.includes('.level-action-btn--replay'), 'CSS has .level-action-btn--replay styling');
assert(pagesCssContent.includes('.level-action-btn--locked'), 'CSS has .level-action-btn--locked styling');

console.log(`\n========================================`);
console.log(`Total tests: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
console.log(`========================================\n`);

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}

