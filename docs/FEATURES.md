# 🍎 Apple Worm Adventure — Feature Specification & Matrix

> **Comprehensive feature audit and verification matrix for Apple Worm Adventure (Phases 1–10).**

---

## 1. Executive Summary

Apple Worm Adventure is a production-ready, full-stack puzzle platformer inspired by classic arcade mechanics. Players navigate an expanding worm through 50 intricate grid-based levels across five themed worlds, solving puzzles by eating apples to grow, avoiding obstacles, managing move limits, and entering dimension portals. The game integrates an authoritative cloud backend for persistence, player progression, tokenized game economy (VELoop Coins), competitive leaderboards, dynamic achievements, and an administrative control panel.

---

## 2. Comprehensive Feature Matrix

| Feature Module | Component / Route | Implementation Details | Status |
| :--- | :--- | :--- | :---: |
| **Puzzle Game Engine** | `GameEngine.js`, `useGameEngine.js` | Grid-based physics, segmented worm slithering, apple eating & growth, move decrement, portal entry trigger, gravity calculation. | ✅ Production Ready |
| **50 Playable Levels** | `levelsData.json`, `Level.js` | 50 distinct hand-crafted levels across 5 worlds with validated solvability, star thresholds, and progressive difficulty. | ✅ Production Ready |
| **Five Themed Worlds** | Levels 1–50 | Sunny Orchard (1–10), Stone Hollows (11–20), Bramble Valley (21–30), Gravity Caverns (31–40), King's Citadel (41–50). | ✅ Production Ready |
| **Undo System** | `GameEngine.js` | State stack snapshot restoring worm position, length, eaten apples, and remaining moves on demand. | ✅ Production Ready |
| **Smart Hint System** | `solver.js` | Breadth-First Search (BFS) pathfinder calculating shortest path from worm head to nearest apple or portal. | ✅ Production Ready |
| **Sound & Audio FX** | `soundEffects.js` | Web Audio API synthesizer generating chiptune sound effects (move, eat, win, lose, click) without external asset latency. | ✅ Production Ready |
| **Arcade Cabinet UI** | `ArcadeCabinet.jsx` | CRT scanlines, pixel marquee, digital LED meters, physical push-buttons, and attract mode screen. | ✅ Production Ready |
| **Mobile & Touch D-Pad** | `GameDPad.jsx` | 4-directional virtual arcade d-pad with haptic touch feedback and keyboard arrow/WASD listeners. | ✅ Production Ready |
| **JWT Authentication** | `authController.js`, `AuthContext.jsx` | Secure user registration, login, JWT token issuance with 7-day expiration, bcrypt password hashing (10 rounds). | ✅ Production Ready |
| **Role-Based Access** | `authMiddleware.js`, `AdminRoute.jsx` | Role verification separating standard players from administrators; protects `/admin` frontend route and `/api/admin/*` endpoints. | ✅ Production Ready |
| **Cloud Progress Sync** | `progressController.js`, `GameContext.jsx` | Automatic sync to MongoDB Atlas on level complete; tracks unlocked levels, completed levels, stars, high scores, and game history. | ✅ Production Ready |
| **VELoop Coin Economy** | `walletController.js`, `rewardController.js` | Authoritative server-side wallet balance, immutable double-entry ledger in `RewardTransaction`, daily earn cap enforcement. | ✅ Production Ready |
| **In-Game Booster Store** | `WalletPage.jsx`, `walletController.js` | Buy Extra Moves (+5), Smart Hints, Revive Tokens, and Double Score Boosts using earned VELoop coins. | ✅ Production Ready |
| **Mock Rewarded Ads** | `WalletPage.jsx`, `rewardController.js` | Simulated sponsored video ads granting coin bonuses with client countdown and server-side cooldown validation. | ✅ Production Ready |
| **Player Dashboard** | `DashboardPage.jsx` | Symmetrical 3x2 metric grid (Levels Cleared, Current Unlocked, Stars Earned, Best Score, Games Played, VELoop Coins). | ✅ Production Ready |
| **Achievements System** | `Achievement.js`, `achievementController.js` | 10 unlockable achievements tracking levels cleared, stars accumulated, and high scores with coin rewards. | ✅ Production Ready |
| **Global Leaderboard** | `LeaderboardPage.jsx`, `leaderboardController.js` | Top rankings filterable by All Levels or individual levels (1–50), sorted by high score and moves taken. | ✅ Production Ready |
| **Admin Control Panel** | `AdminPage.jsx`, `adminController.js` | System analytics, economy configuration (daily caps, booster prices, reward multipliers), and player role management. | ✅ Production Ready |
| **Vercel Deployment** | `vercel.json`, `client/vercel.json` | Single Page Application (SPA) rewrite rules preventing 404 on direct route navigation and page reloads. | ✅ Production Ready |
| **Render/Railway Deployment** | `server/src/index.js` | Multi-origin CORS support (Vercel previews, localhost, custom domains), health check endpoint, environment fallback. | ✅ Production Ready |

---

## 3. Five Themed Worlds Breakdown

### World 1: Sunny Orchard (Levels 1–10)
* **Theme:** Lush green apple orchard with gentle slopes and open paths.
* **Difficulty:** Easy.
* **Mechanics:** Basic slithering, horizontal eating, single-apple puzzles, introducing 1-move turns and portal exit mechanics.
* **Move Budgets:** 15–25 moves per puzzle.

### World 2: Stone Hollows (Levels 11–20)
* **Theme:** Rocky caverns with narrow stone corridors and stone obstacles.
* **Difficulty:** Medium.
* **Mechanics:** 2 to 3 apples per level, requiring players to plan growth sequences to avoid trapping the worm's own body.
* **Move Budgets:** 20–35 moves per puzzle.

### World 3: Bramble Valley (Levels 21–30)
* **Theme:** Overgrown thicket with thorny barriers and tight cornering.
* **Difficulty:** Medium-Hard.
* **Mechanics:** Tight choke points where growing too early obstructs the return path; body manipulation around immovable obstacles.
* **Move Budgets:** 25–40 moves per puzzle.

### World 4: Gravity Caverns (Levels 31–40)
* **Theme:** Subterranean abyss with deep drop-offs and platforming puzzles.
* **Difficulty:** Hard.
* **Mechanics:** Gravity physics and platform ledge balancing where worm segments hang over empty space.
* **Move Budgets:** 30–50 moves per puzzle.

### World 5: King's Citadel (Levels 41–50)
* **Theme:** Grand royal fortress with labyrinthine hallways and multi-stage gates.
* **Difficulty:** Expert.
* **Mechanics:** 4+ apples, complex winding paths, tight move constraints requiring optimal moves for 3-star ratings.
* **Move Budgets:** 35–65 moves per puzzle.

---

## 4. Star Rating & Scoring Mechanics

Every level awards between 1 and 3 stars based on move efficiency:
* **3 Stars (Gold):** Completed within the target optimal move threshold ($\le 1.25 \times \text{par moves}$).
* **2 Stars (Silver):** Completed within the intermediate move threshold ($\le 1.6 \times \text{par moves}$).
* **1 Star (Bronze):** Completed before exhausting the maximum move limit.

### Score Calculation Formula
$$\text{Score} = (\text{Apples Eaten} \times 250) + (\text{Remaining Moves} \times 50) + (\text{Stars} \times 200)$$
* When the Double Score booster is activated, the final score is multiplied by $2\times$.
* Scores are saved to MongoDB Atlas and published to the global level leaderboard if they exceed the user's personal best.

---

## 5. Wallet & Economy Engine

* **Currency:** VELoop Coins ($\text{VC}$).
* **Earning Avenues:**
  * Initial Registration Bonus: $+200\text{ VC}$
  * Level First-Time Clear: $+50\text{ VC}$
  * Level 3-Star Mastery: $+25\text{ VC}$
  * Daily Check-In Bonus: $+25\text{ VC}$
  * Mock Rewarded Video: $+50\text{ VC}$ (daily limit applied)
  * Achievement Milestone: $+20\text{ to } +500\text{ VC}$
* **Spending Avenues (Booster Store):**
  * Extra Moves Pack (+5 moves during active puzzle): $50\text{ VC}$
  * Smart BFS Hint (reveals optimal next move): $40\text{ VC}$
  * Revive Token (continue from failure state): $75\text{ VC}$
  * Double Score Boost ($2\times$ session score multiplier): $60\text{ VC}$
* **Auditing & Safety:**
  * Every balance change generates an immutable `RewardTransaction` record with `balanceBefore`, `balanceAfter`, `amount`, and `rewardSource`.
  * Server enforces daily earn caps configured in `EconomyConfig` to prevent reward inflation.

