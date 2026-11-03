// ==========================================
// Verification Test: Collapsible Dashboard Cards
// ==========================================

import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${msg}`);
    pass++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${msg}`);
    fail++;
  }
}

console.log('\n======================================================');
console.log('📦 COLLAPSIBLE DASHBOARD CARDS VERIFICATION');
console.log('======================================================\n');

const homePagePath = path.resolve('client/src/pages/HomePage.jsx');
const homeCode = fs.readFileSync(homePagePath, 'utf8');

// 1. Structure Tests
assert(homeCode.includes('collapsible-card--profile'), 'Profile Card has collapsible card class');
assert(homeCode.includes('collapsible-card--rules'), 'Rules Card has collapsible card class');
assert(homeCode.includes('collapsible-card--rewards'), 'Rewards Card has collapsible card class');

// 2. Default Header Titles and Icons
assert(homeCode.includes('👤') && homeCode.includes('Player Profile'), 'Profile Card default state has icon 👤 and title "Player Profile"');
assert(homeCode.includes('🍎') && homeCode.includes('How to Play'), 'Rules Card default state has icon 🍎 and title "How to Play"');
assert(homeCode.includes('🪙') && homeCode.includes('VELoop Rewards'), 'Rewards Card default state has icon 🪙 and title "VELoop Rewards"');

// 3. Expanded Content Presence
assert(homeCode.includes('profile-avatar') && homeCode.includes('Open Player Dashboard'), 'Profile Card expanded content has avatar, stats and Open Player Dashboard button');
assert(homeCode.includes('Eat Apples:') && homeCode.includes('Mind the Obstacles:') && homeCode.includes('Enter the Portal:'), 'Rules Card expanded content has the 3 detailed instructions');
assert(homeCode.includes('teaser-items-preview') && homeCode.includes('Visit Rewards'), 'Rewards Card expanded content has preview icons and Visit Rewards button');

// 4. Mobile & Click/Tap Toggle State
assert(homeCode.includes('expandedCard') && homeCode.includes('toggleCard'), 'HomePage maintains expandedCard state for mobile touch support');
assert(homeCode.includes('is-expanded'), 'Cards toggle is-expanded class on click/tap');
assert(homeCode.includes('e.stopPropagation()'), 'Button clicks stop propagation to avoid unwanted toggling');

// 5. CSS Stylesheet Tests
const pagesCssPath = path.resolve('client/src/pages/pages.css');
const css = fs.readFileSync(pagesCssPath, 'utf8');

assert(css.includes('.home-features-grid') && css.includes('align-items: start;'), 'Features grid has align-items: start to keep row alignment without stretching');
assert(css.includes('grid-template-rows: 0fr;'), 'Card collapsible body default state has grid-template-rows: 0fr');
assert(css.includes('grid-template-rows: 1fr;'), 'Card collapsible body expanded state transitions to grid-template-rows: 1fr');
assert(css.includes('.collapsible-card--profile:hover') && css.includes('--neon-cyan'), 'Profile card has neon cyan hover/focus glow');
assert(css.includes('.collapsible-card--rules:hover') && css.includes('--neon-green'), 'Rules card has neon green hover/focus glow');
assert(css.includes('.collapsible-card--rewards:hover') && css.includes('--neon-amber'), 'Rewards card has neon amber hover/focus glow');
assert(css.includes('prefers-reduced-motion'), 'Reduced motion accessibility query is respected');

console.log('\n======================================================');
console.log(`TOTAL PASSES: ${pass}`);
console.log(`TOTAL FAILURES: ${fail}`);
console.log('======================================================\n');

if (fail > 0) process.exit(1);

