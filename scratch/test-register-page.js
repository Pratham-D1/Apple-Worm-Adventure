// ==========================================
// Verification Test: Registration Page One-Frame & Placeholders
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
console.log('📝 REGISTRATION PAGE VERIFICATION');
console.log('======================================================\n');

const regPath = path.resolve('client/src/pages/RegisterPage.jsx');
const regCode = fs.readFileSync(regPath, 'utf8');

// 1. Placeholders
assert(regCode.includes('placeholder="Enter your name"'), 'Username input has placeholder "Enter your name"');
assert(regCode.includes('placeholder="Enter email"'), 'Email input has placeholder "Enter email"');
assert(regCode.includes('placeholder="Enter your password"'), 'Password input has placeholder "Enter your password"');
assert(regCode.includes('placeholder="Confirm your password"'), 'Confirm Password input has placeholder "Confirm your password"');

// 2. CSS Layout Tests
const cssPath = path.resolve('client/src/pages/pages.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert(css.includes('.auth-page-container') && css.includes('flex: 1;'), 'Auth container fills available viewport height');
assert(css.includes('.auth-card') && css.includes('max-width: 480px;'), 'Auth card has spacious width');
assert(css.includes('.form-input') && css.includes('padding: 0.65rem 0.95rem;'), 'Form input has comfortable padding');

// 3. Compact Footer
const layoutCssPath = path.resolve('client/src/components/layout/layout.css');
const layoutCss = fs.readFileSync(layoutCssPath, 'utf8');
assert(layoutCss.includes('.game-footer') && layoutCss.includes('padding: 0.45rem 0;'), 'Footer has slim compact padding');

console.log('\n======================================================');
console.log(`TOTAL PASSES: ${pass}`);
console.log(`TOTAL FAILURES: ${fail}`);
console.log('======================================================\n');

if (fail > 0) process.exit(1);
