# 📡 Apple Worm Adventure — REST API Documentation

> **Complete endpoint reference, authentication protocols, payload schemas, and error codes.**

---

## 1. Overview & Base URL

The Apple Worm Adventure backend provides a RESTful API built on Node.js and Express, connected to MongoDB Atlas via Mongoose.

* **Base URL (Local):** `http://localhost:5000/api`
* **Base URL (Production):** `https://<your-backend-domain>.onrender.com/api`
* **Content-Type:** `application/json`

---

## 2. Authentication Protocol

Private routes require a valid JSON Web Token (JWT) supplied in the HTTP `Authorization` request header using the standard Bearer scheme:

```http
Authorization: Bearer <your_jwt_token_here>
```

Tokens are issued upon successful registration or login via `/api/auth/register` or `/api/auth/login`, and carry a 7-day expiration.

---

## 3. Standard Response Format

All responses follow a predictable JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Detailed description of the error",
  "statusCode": 400
}
```

### HTTP Status Codes
| Status | Meaning | Scenario |
| :--- | :--- | :--- |
| `200 OK` | Request Succeeded | Data retrieved or operation completed. |
| `201 Created` | Resource Created | User registered or record created. |
| `400 Bad Request` | Validation Failure | Missing required fields, invalid move counts. |
| `401 Unauthorized` | Missing / Invalid Token | Authentication required or expired token. |
| `403 Forbidden` | Access Denied | Player attempting to access administrator endpoints. |
| `404 Not Found` | Resource Missing | Level number or user ID does not exist. |
| `429 Too Many Requests` | Rate Limited | Exceeded daily claim or ad cap limits. |
| `500 Server Error` | Internal Failure | Unhandled database or operational error. |

---

## 4. Endpoints Reference

### 4.1 System & Health

#### `GET /`
Welcoming root endpoint with server metadata.
* **Access:** Public

#### `GET /api/health`
Health check providing database connectivity state.
* **Access:** Public
* **Response Example:**
```json
{
  "status": "ok",
  "game": "Apple Worm Adventure",
  "timestamp": "2026-11-03T10:00:00.000Z",
  "environment": "production",
  "database": {
    "connected": true,
    "state": "connected",
    "name": "apple_worm_adventure",
    "host": "cluster0.example.mongodb.net"
  }
}
```

---

### 4.2 Authentication (`/api/auth`)

#### `POST /api/auth/register`
Register a new player account.
* **Access:** Public
* **Request Body:**
```json
{
  "username": "AppleHero",
  "email": "hero@appleworm.dev",
  "password": "Password123!"
}
```
* **Response:** Returns JWT token and sanitized user profile (`walletBalance: 200`, `role: "player"`).

#### `POST /api/auth/login`
Authenticate with email and password.
* **Access:** Public
* **Request Body:**
```json
{
  "email": "hero@appleworm.dev",
  "password": "Password123!"
}
```
* **Response:** Returns JWT token, user profile, and linked progress summary.

#### `GET /api/auth/me`
Retrieve authenticated user profile and wallet balance.
* **Access:** Private (`Bearer <token>`)

---

### 4.3 Player Progress (`/api/progress`)

#### `GET /api/progress`
Fetch authenticated user's complete campaign progress.
* **Access:** Private
* **Response:**
```json
{
  "success": true,
  "progress": {
    "unlockedLevels": [1, 2, 3, 4, 5, 6],
    "completedLevels": [
      {
        "levelNumber": 1,
        "stars": 3,
        "movesTaken": 8,
        "bestScore": 1420,
        "completedAt": "2026-11-03T09:00:00.000Z"
      }
    ],
    "starsEarned": 14,
    "totalScore": 6750,
    "totalGamesPlayed": 9
  }
}
```

#### `POST /api/progress/complete`
Authoritatively submit a level completion record.
* **Access:** Private
* **Request Body:**
```json
{
  "levelNumber": 1,
  "movesTaken": 8,
  "applesEaten": 1,
  "stars": 3,
  "score": 1420
}
```
* **Logic:** Unlocks next level (`levelNumber + 1`), updates high score and star count, triggers achievement evaluation, and grants first-clear coin rewards.

---

### 4.4 Wallet & Economy (`/api/wallet`)

#### `GET /api/wallet/balance`
Fetch current VELoop coin balance and daily earn progress.
* **Access:** Private

#### `POST /api/wallet/purchase-booster`
Purchase an in-game booster using VELoop coins.
* **Access:** Private
* **Request Body:**
```json
{
  "boosterType": "smartHints",
  "cost": 40
}
```
* **Valid Booster Types:** `extraMoves`, `smartHints`, `reviveTokens`, `doubleScoreBoosts`.

#### `GET /api/wallet/transactions`
Retrieve the authenticated player's immutable transaction ledger.
* **Access:** Private

---

### 4.5 Rewards & Ad Simulation (`/api/rewards`)

#### `POST /api/rewards/claim-daily`
Claim daily check-in bonus (once per 24-hour cycle).
* **Access:** Private
* **Response:** $+25\text{ VC}$ credited with updated ledger entry.

#### `POST /api/rewards/claim-ad`
Claim reward after viewing simulated video ad.
* **Access:** Private
* **Response:** $+50\text{ VC}$ credited, respecting daily ad view caps.

---

### 4.6 Leaderboard (`/api/leaderboard`)

#### `GET /api/leaderboard`
Retrieve global top scores across all levels.
* **Access:** Public
* **Query Parameters:** `?limit=25&page=1`

#### `GET /api/leaderboard/:levelNumber`
Retrieve high scores for a specific puzzle level (1–50).
* **Access:** Public

---

### 4.7 Achievements (`/api/achievements`)

#### `GET /api/achievements`
Fetch list of all 10 system achievements with unlocked status for current user.
* **Access:** Private

#### `POST /api/achievements/claim/:slug`
Claim coin reward for an achieved milestone.
* **Access:** Private

---

### 4.8 Admin Management (`/api/admin`)

#### `GET /api/admin/stats`
System-wide metrics (total players, total completions, total coins circulating).
* **Access:** Admin Only (`requireAdmin`)

#### `GET /api/admin/users`
Paginated player list with roles and wallet balances.
* **Access:** Admin Only

#### `PUT /api/admin/users/:id/role`
Promote or demote a user (`"player"` or `"admin"`).
* **Access:** Admin Only

#### `GET /api/economy/config` & `PUT /api/economy/config`
Read or update global game economy parameters (daily earn caps, booster costs, reward multipliers).
* **Access:** Admin Only

