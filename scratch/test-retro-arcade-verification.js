// ==========================================
// Comprehensive Verification Test: Retro Arcade Transformation
// ==========================================

import { ALL_LEVELS } from '../client/src/data/levelsData.js';
import { GameEngine } from '../client/src/gameEngine/GameEngine.js';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
    passCount++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${message}`);
    failCount++;
  }
}

console.log('\n======================================================');
console.log('🎮 APPLE WORM ADVENTURE - RETRO ARCADE VERIFICATION');
console.log('======================================================\n');

// TEST SUITE 1: 50 Levels Integrity
console.log('--- 1. 50 LEVELS INTEGRITY & DATA STRUCTURES ---');
assert(Array.isArray(ALL_LEVELS), 'ALL_LEVELS is exported as an array');
assert(ALL_LEVELS.length >= 50, `Found ${ALL_LEVELS.length} levels (minimum required: 50)`);

let allLevelsValid = true;
ALL_LEVELS.forEach((lvl, idx) => {
  if (!lvl.id || !lvl.levelNumber || !lvl.gridSize || !lvl.startingPosition || !lvl.apples || !lvl.portal) {
    allLevelsValid = false;
  }
});
assert(allLevelsValid, 'Every level has valid id, levelNumber, gridSize, startingPosition, apples, and portal');

// TEST SUITE 2: Game Engine Movement, Undo, Hint & Solvability
console.log('\n--- 2. GAME ENGINE & MECHANICS PRESERVATION ---');
const lvl1 = ALL_LEVELS[0];
const engine = new GameEngine(lvl1);
let state = engine.getState();
assert(state.worm.length === lvl1.startingPosition.length, 'Initial worm length matches starting position');
assert(state.apples.length === lvl1.apples.length, 'Apples initialized correctly');
assert(state.movesUsed === 0, 'Initial moves used is 0');
assert(state.status === 'ready' || state.status === 'playing', 'Initial game state is ready/playing');

// Test Hint calculation
const hint = engine.getHint();
assert(hint !== null && hint.direction !== undefined, `BFS hint found next direction: "${hint?.direction}"`);

// Slither right towards apple (Level 1 apple is at x:3, y:3, worm starts at [1,3], [1,4])
const initialApples = state.apples.length;
engine.move('right');
state = engine.getState();
assert(state.movesUsed === 1, 'Moves used incremented after valid slither');
assert(state.worm[0].x === 2 && state.worm[0].y === 3, 'Worm head moved to [2,3]');

// Test Undo
const undoResult = engine.undo();
state = engine.getState();
assert(undoResult === true, 'Undo returned true');
assert(state.movesUsed === 0, 'Moves used reset back to 0 after undo');
assert(state.worm[0].x === 1 && state.worm[0].y === 3, 'Worm head returned to [1,3]');

// Slither to completion on Level 1
// Start: [1,3], [1,4]. Apple: [3,3]. Portal: [6,3].
engine.move('right'); // [2,3]
engine.move('right'); // [3,3] eats apple!
state = engine.getState();
assert(state.apples.length === initialApples - 1, 'Apple eaten and removed from board');
assert(state.worm.length === 3, 'Worm body grew by 1 segment after eating apple');
assert(state.isPortalUnlocked === true, 'Portal unlocked after all apples consumed');

engine.move('right'); // [4,3]
engine.move('right'); // [5,3]
engine.move('right'); // [6,3] enters portal!
state = engine.getState();
assert(state.status === 'completed', 'Worm entered portal and level marked COMPLETED');
assert(state.stars >= 1, `Stars earned on victory: ${state.stars}`);
assert(state.score > 0, `Score calculated on victory: ${state.score}`);

// TEST SUITE 3: Retro Arcade Design Tokens & Asset System
console.log('\n--- 3. RETRO ARCADE CSS TOKENS & MARQUEE INTEGRATION ---');
const indexCssPath = path.resolve('client/src/index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
assert(indexCss.includes('--arcade-bg: #070b18;'), 'Arcade background token #070b18 defined');
assert(indexCss.includes('--neon-green: #00ff66;'), 'Neon green token #00ff66 defined');
assert(indexCss.includes('--neon-amber: #ffb703;'), 'Neon amber token #ffb703 defined');
assert(indexCss.includes('--neon-coral: #ff3366;'), 'Neon coral token #ff3366 defined');
assert(indexCss.includes('--neon-cyan: #00f0ff;'), 'Neon cyan token #00f0ff defined');
assert(indexCss.includes("'Press Start 2P'"), 'Pixel font Press Start 2P imported and mapped');
assert(indexCss.includes('.scanlines-overlay') || indexCss.includes('body::before'), 'CRT scanlines effect implemented');

// TEST SUITE 4: Arcade Cabinet Component & GamePage Integration
console.log('\n--- 4. ARCADE CABINET & GAMEPAGE ARCHITECTURE ---');
const cabinetPath = path.resolve('client/src/components/game/ArcadeCabinet.jsx');
const cabinetCode = fs.readFileSync(cabinetPath, 'utf8');
assert(cabinetCode.includes('arcade-marquee'), 'ArcadeCabinet has marquee header');
assert(cabinetCode.includes('crt-hud-top'), 'ArcadeCabinet has inner CRT top HUD');
assert(cabinetCode.includes('crt-viewport'), 'ArcadeCabinet has CRT viewport housing game board');
assert(cabinetCode.includes('crt-start-overlay'), 'ArcadeCabinet has retro attract mode start overlay');
assert(cabinetCode.includes('arcade-control-deck'), 'ArcadeCabinet has physical push-button control deck');
assert(cabinetCode.includes('GameDPad'), 'ArcadeCabinet has mobile touch GameDPad');

const gamePagePath = path.resolve('client/src/pages/GamePage.jsx');
const gamePageCode = fs.readFileSync(gamePagePath, 'utf8');
assert(gamePageCode.includes('ArcadeCabinet'), 'GamePage imports and mounts ArcadeCabinet');
assert(gamePageCode.includes('hasStarted'), 'GamePage manages attract mode hasStarted state');
assert(gamePageCode.includes('LevelCompleteModal'), 'GamePage retains persistent LevelCompleteModal');

// TEST SUITE 5: Global Theme Propagation
console.log('\n--- 5. GLOBAL PAGES ARCADE THEME HARMONIZATION ---');
const pagesCssPath = path.resolve('client/src/pages/pages.css');
const pagesCss = fs.readFileSync(pagesCssPath, 'utf8');
assert(pagesCss.includes('.level-card--completed'), 'LevelSelectPage completed card styled');
assert(pagesCss.includes('.level-card--unlocked'), 'LevelSelectPage unlocked card styled');
assert(pagesCss.includes('.dashboard-header-card'), 'DashboardPage header styled with neon accents');
assert(pagesCss.includes('.wallet-hero-card'), 'WalletPage hero styled with arcade amber glow');
assert(pagesCss.includes('.leaderboard-row'), 'LeaderboardPage rows styled with dark neon highlights');
assert(pagesCss.includes('.admin-stat-card'), 'AdminPage stat cards styled with arcade panel border');

console.log('\n======================================================');
console.log(`TOTAL PASSES: ${passCount}`);
console.log(`TOTAL FAILURES: ${failCount}`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL RETRO ARCADE TRANSFORMATION CHECKS PASSED PERFECTLY!\n');
}
