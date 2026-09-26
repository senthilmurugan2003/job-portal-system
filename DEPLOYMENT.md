# 🚀 Live Deployment Guide (GitHub + Railway + Vercel)

This guide walks you through deploying your **Job Portal System** to production:
1. **GitHub** (Code Repository)
2. **Railway** (Flask Python Backend API + PostgreSQL Database)
3. **Vercel** (HTML / CSS / JavaScript Frontend)

---

## 1. Step 1: Push Code to GitHub

Open your terminal (PowerShell or Bash) in the project directory:

```bash
# 1. Navigate to the project root
cd c:\Users\pc\Downloads\job-portal-system\job-portal-system

# 2. Initialize git (if not already done)
git init

# 3. Add files and make initial commit
git add .
git commit -m "feat: complete job portal with AI recommendation and deployment configs"

# 4. Rename branch to main
git branch -M main

# 5. Connect your remote GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/job-portal-system.git

# 6. Push to GitHub
git push -u origin main
```

---

## 2. Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and log in / sign up with GitHub.
2. Click **+ New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select your `job-portal-system` repository.
4. **Add PostgreSQL Database** (Optional but recommended):
   - In the project canvas, click **+ New** $\rightarrow$ **Database** $\rightarrow$ **Add PostgreSQL**.
   - Railway will automatically provision a database and set the `DATABASE_URL` environment variable for your service.
5. **Set Environment Variables**:
   - Go to your backend service $\rightarrow$ **Variables** tab and add:
     - `SECRET_KEY` = `your-super-secret-key-32-chars-or-more`
     - `JWT_SECRET_KEY` = `your-super-jwt-secret-key-32-chars-or-more`
     - `FLASK_ENV` = `production`
     - `PYTHONUNBUFFERED` = `1`
6. **Generate Public Domain**:
   - Go to **Settings** tab $\rightarrow$ **Networking** $\rightarrow$ Click **Generate Domain**.
   - You will receive a URL like: `https://job-portal-production.up.railway.app`.
   - Copy this URL!

---

## 3. Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your `job-portal-system` repository.
4. In the **Configure Project** screen:
   - **Root Directory**: Click *Edit* and select `frontend` (or leave root if deploying full repo).
   - **Framework Preset**: Select `Other`.
5. Click **Deploy**.
6. Once deployed, Vercel will give you a live domain (e.g., `https://job-portal-frontend.vercel.app`).

---

## 4. Connecting Frontend to your Live Railway Backend

Your frontend dynamically connects to your Railway backend:
- Open `frontend/js/config.js` and update line 22 with your Railway backend URL:
  ```javascript
  window.API_URL = window.ENV_API_URL || "https://YOUR-RAILWAY-APP.up.railway.app";
  ```
- Or set it directly in your browser console / `localStorage`:
  ```javascript
  localStorage.setItem("API_URL", "https://YOUR-RAILWAY-APP.up.railway.app");
  ```
- Commit and push to GitHub:
  ```bash
  git add frontend/js/config.js
  git commit -m "chore: set production backend Railway URL"
  git push origin main
  ```
- Vercel will automatically re-deploy your frontend in seconds!

---

## ✅ Deployment Checklist

- [x] `requirements.txt` with gunicorn and production dependencies.
- [x] `Procfile` configured (`web: gunicorn run:app`).
- [x] `railway.json` Nixpacks configuration added.
- [x] `vercel.json` routing configuration added.
- [x] Dynamic `API_URL` config added across all frontend JavaScript files.
- [x] CORS enabled for cross-origin API calls from Vercel to Railway.
- [x] Auto-table creation `db.create_all()` enabled on app startup.
- [x] PostgreSQL `postgres://` to `postgresql://` URL fix for SQLAlchemy.
