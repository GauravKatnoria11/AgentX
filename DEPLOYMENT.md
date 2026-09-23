# Carelink Platform: Production Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions to deploy the **Carelink AI Healthcare Platform**:
- **Backend (FastAPI)** on **[Render](https://render.com)**
- **Frontend (React + Vite)** on **[Vercel](https://vercel.com)**
- **Database & Auth** on **[Supabase](https://supabase.com)**

---

## Architecture Overview

```
                      +-----------------------------+
                      |       User's Browser        |
                      +--------------+--------------+
                                     |
               HTTPS (Client App)    |    API Requests
                                     v
                 +-------------------+-------------------+
                 |                                       |
                 v                                       v
     +-----------------------+               +-----------------------+
     |   Vercel (Frontend)   |               |   Render (Backend)    |
     |   React + Vite SPA    |               |   FastAPI + Uvicorn   |
     |   https://*.vercel.app|               |   https://*.onrender  |
     +-----------------------+               +-----------+-----------+
                                                         |
                                                         | Database & Auth
                                                         v
                                             +-----------------------+
                                             |       Supabase        |
                                             | PostgreSQL + Storage  |
                                             +-----------------------+
```

---

## Pre-requisites

1. **GitHub Account**: Your codebase pushed to a GitHub repository.
2. **Render Account**: [https://render.com](https://render.com) (Free tier available).
3. **Vercel Account**: [https://vercel.com](https://vercel.com) (Free tier available).
4. **Supabase Account**: Project URL, Anon Key, and Service Role Key from your Supabase Dashboard.
5. **Google Gemini API Key**: For AI Healthcare search and summary features.
6. **Google Maps API Key**: For distance calculation and live route ETAs.

---

## Step 1: Push Code to GitHub

Make sure your latest code and deployment configurations are committed and pushed:

```bash
git add .
git commit -m "chore: configure Vercel and Render deployment settings"
git push origin main
```

---

## Step 2: Deploy Backend to Render

You can deploy the backend using either **Option A (Render Blueprint - Easiest)** or **Option B (Manual Web Service)**.

### Option A: 1-Click Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](./render.yaml).
5. Fill in the required environment variables prompted on the screen (Supabase keys, Gemini key, Maps key).
6. Click **Apply**. Render will build and deploy the service.

---

### Option B: Manual Web Service Setup
1. On the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:

| Setting | Value |
| :--- | :--- |
| **Name** | `carelink-backend` (or your choice) |
| **Language / Runtime** | `Python` |
| **Region** | Choose closest to you (e.g., Oregon, Ohio, Frankfurt, Singapore) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |

4. Scroll down to **Environment Variables** and add:

| Key | Value / Source |
| :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` |
| `APP_ENV` | `production` |
| `PORT` | `10000` |
| `SUPABASE_URL` | Your Supabase Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase `service_role` secret key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GOOGLE_MAPS_API_KEY` | Your Google Maps API key |
| `JWT_SECRET` | Any strong random string (e.g. `carelink-prod-jwt-secret-xyz-987`) |
| `RESEND_API_KEY` | Your Resend API key (e.g. `re_JgXyeiYh_...`) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (or your verified domain) |
| `FRONTEND_URL` | `https://your-frontend-project.vercel.app` (leave default until frontend is deployed, then update) |
| `ALLOWED_ORIGINS` | Comma-separated domains if using custom domains |

5. Click **Create Web Service**.
6. Once deployed, note down your Render service URL (e.g., `https://carelink-backend.onrender.com`).
7. Test the health endpoint in your browser: `https://carelink-backend.onrender.com/health` (should return `{"status":"ok"}`).

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** screen, configure:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click **Edit** and select `frontend` |
| **Build Command** | `npm run build` (Default) |
| **Output Directory** | `dist` (Default) |
| **Install Command** | `npm install` (Default) |

5. Expand the **Environment Variables** section and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://carelink-backend.onrender.com` | **Your Render Backend URL** (do NOT add trailing slash) |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Your Supabase Anon Public Key |
| `VITE_GOOGLE_MAP_API_KEY`| `AIzaSy...` | Your Google Maps API Key |

6. Click **Deploy**.
7. Vercel will install dependencies, build Vite, and deploy your site to `https://<your-project>.vercel.app`.

---

## Step 4: Final Connect & CORS Verification

1. Copy your live Vercel domain (e.g., `https://carelink-frontend.vercel.app`).
2. Go back to your **Render Dashboard** > select `carelink-backend` > **Environment**.
3. Update `FRONTEND_URL` with your exact Vercel URL:
   ```
   FRONTEND_URL=https://carelink-frontend.vercel.app
   ```
4. Click **Save Changes** (Render will automatically redeploy the backend with the new setting).
5. Note: The backend already contains built-in wildcard regex support (`allow_origin_regex=r"https://.*\.vercel\.app"`) which allows all Vercel branch previews automatically!

---

## Common Pitfalls & Solutions

### 1. Render Free Tier Cold Starts
- On Render's free tier, backend instances spin down after 15 minutes of inactivity.
- The first request after sleep takes ~45-50 seconds to boot up. Subsequent requests respond in milliseconds.
- *Tip*: You can set up a free uptime monitor (like [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org)) to ping `https://your-backend.onrender.com/health` every 10 minutes to keep it warm.

### 2. Double Slash in API URL
- Make sure `VITE_API_URL` on Vercel is `https://your-backend.onrender.com` (without a trailing `/`).
- The frontend code includes an automatic `.replace(/\/+$/, '')` safeguard to prevent double slashes.

### 3. SPA 404 Errors on Refresh
- React/Vite SPAs require routing all URLs back to `/index.html`.
- This has been solved via [`frontend/vercel.json`](./frontend/vercel.json) rewrite rules.

---

## Verification Checklist

- [ ] `https://<your-backend>.onrender.com/health` returns `{"status":"ok"}`
- [ ] `https://<your-backend>.onrender.com/docs` opens Swagger UI documentation
- [ ] `https://<your-frontend>.vercel.app` loads the Google Classroom styled Carelink platform
- [ ] Booking an appointment creates a record and triggers appointment tokens
- [ ] Refreshing on any route (`/appointments`, `/doctors`, `/prescriptions`) loads cleanly without 404 errors
