# 🚀 Apple Worm Adventure — Production Deployment Guide

> **Step-by-step instructions for deploying frontend on Vercel, backend on Render/Railway, and configuring MongoDB Atlas.**

---

## 1. Production Architecture Overview

Apple Worm Adventure is decoupled into a static frontend Single Page Application (SPA) and an API backend:

```
┌─────────────────────────┐       HTTPS / REST       ┌─────────────────────────┐
│     Frontend (SPA)      │ ───────────────────────> │      Backend (API)      │
│  Deployed on: Vercel    │ <─────────────────────── │  Deployed on: Render    │
│  React 18 + Vite Bundle │      JSON Payload        │  Node.js + Express 4    │
└─────────────────────────┘                          └────────────┬────────────┘
                                                                  │ Mongoose ODM
                                                                  │ TLS / Replica Set
                                                     ┌────────────▼────────────┐
                                                     │     MongoDB Atlas       │
                                                     │  Cloud Database Cluster │
                                                     └─────────────────────────┘
```

---

## 2. Step 1: MongoDB Atlas Configuration

1. **Create an Atlas Cluster:**
   * Log in to [MongoDB Cloud](https://cloud.mongodb.com/).
   * Create a free shared cluster (`M0 Sandbox` or higher) in your preferred region.

2. **Configure Database User:**
   * Navigate to **Security** $\rightarrow$ **Database Access**.
   * Click **Add New Database User**.
   * Authentication Method: **Password**.
   * Role: **Read and write to any database** (`readWriteAnyDatabase`).
   * Note the username and password securely.

3. **Configure Network Access:**
   * Navigate to **Security** $\rightarrow$ **Network Access**.
   * Click **Add IP Address**.
   * Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so that cloud platforms like Render or Railway can connect dynamically.

4. **Retrieve Connection String:**
   * In **Database Deployments**, click **Connect** $\rightarrow$ **Drivers** (Node.js).
   * Connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/apple_worm_adventure?retryWrites=true&w=majority
     ```

---

## 3. Step 2: Backend Deployment on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `Apple-Worm-Adventure`.
3. Configure service parameters:
   * **Name:** `apple-worm-adventure-api`
   * **Region:** Closest to your MongoDB Atlas cluster (e.g., Oregon, Frankfurt).
   * **Root Directory:** `server`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start` (or `node src/index.js`)
   * **Instance Type:** Free

4. Configure **Environment Variables** in Render settings:

| Key | Suggested Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Port automatically assigned by Render |
| `MONGODB_URI` | `mongodb+srv://...` | Real Atlas connection string |
| `DB_NAME` | `apple_worm_adventure` | Target database name |
| `JWT_SECRET` | *(Random 32+ char string)* | Key used to sign JWT session tokens |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | Allowed CORS origin |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Secondary CORS origin |
| `GAME_NAME` | `Apple Worm Adventure` | Branding label |

5. Deploy the service and verify status by visiting `https://<your-render-subdomain>.onrender.com/api/health`.

---

## 4. Step 3: Database Seeding in Production

After the backend is live and connected to MongoDB Atlas, run the master seed script to provision the 50 levels, default achievements, and demo accounts:

**Option A (Local Terminal with Production URI):**
```bash
cd server
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/apple_worm_adventure?retryWrites=true&w=majority" npm run seed:all
```

**Option B (Render Shell):**
In the Render dashboard, open the **Shell** tab of your service and run:
```bash
npm run seed:all
```

This will safely and idempotently provision:
* All 50 Levels into the `levels` collection.
* All 10 Achievements into the `achievements` collection.
* Demo Player (`demo@appleworm.dev` / `DemoPassword123!`) with 5 completed levels and 350 coins.
* Demo Admin (`admin@appleworm.dev` / `AdminPassword123!`).

---

## 5. Step 4: Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Import the `Apple-Worm-Adventure` repository.
3. Configure project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click Edit and select `client`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Install Command:** `npm install`

4. Add **Environment Variables** in Vercel:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<your-render-app>.onrender.com/api` | Live backend API URL |
| `VITE_GAME_NAME` | `Apple Worm Adventure` | Game title |

5. Click **Deploy**. Vercel will build the bundle using `client/vercel.json` for SPA routing rewrites.

---

## 6. Verification & Troubleshooting

### 1. SPA Refresh 404 Prevention
Both `client/vercel.json` and root `vercel.json` contain the rewrite rule:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This guarantees that refreshing routes like `/levels`, `/dashboard`, or `/admin` delivers the client router without 404s.

### 2. CORS Errors
If the browser console displays a CORS origin error:
1. Ensure `CLIENT_URL` or `FRONTEND_URL` on the backend matches the exact URL of your Vercel deployment (including `https://` without a trailing slash).
2. The backend is configured to automatically permit all `*.vercel.app` domains, localhost, and explicit environment origins.

### 3. Cold Starts on Free Tier
Render free instances spin down after 15 minutes of inactivity. The initial HTTP request may take 30–50 seconds to warm up. The frontend shows clear status indicators during network synchronization.

