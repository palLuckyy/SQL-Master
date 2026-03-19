# SQL Master 🚀
### Learn · Practice · Master SQL

A full-stack interactive SQL learning platform with 200+ data cleaning challenges, 50 SQL JOIN questions, interview prep, an AI-powered playground, and a secure Admin panel.

---

## 📁 Project Structure

```
sql-master/
├── backend/           ← Express + SQLite API
│   ├── server.js      ← Main API server
│   ├── db.js          ← Database setup & seed data
│   ├── package.json
│   └── .env.example   ← Copy to .env and fill in
│
└── frontend/          ← React + Vite app
    ├── src/
    │   ├── App.jsx    ← Main application (all views)
    │   ├── api.js     ← Backend API calls
    │   └── main.jsx   ← Entry point
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example   ← Copy to .env
```

---

## 🖥️ Running Locally in VS Code

### Step 1 — Install Node.js
Download and install from: https://nodejs.org  
Choose the **LTS version** (e.g. v20.x).

Verify installation by opening VS Code terminal (`Ctrl+` ` `) and running:
```bash
node -v    # Should show v18+ or v20+
npm -v     # Should show 9+ or 10+
```

### Step 2 — Open the project in VS Code
1. Unzip/move the `sql-master` folder somewhere on your computer (e.g. `C:\Projects\sql-master` or `~/Projects/sql-master`)
2. Open VS Code
3. Click **File → Open Folder** and select the `sql-master` folder
4. You should see both `backend/` and `frontend/` in the Explorer sidebar

### Step 3 — Set up the Backend

Open a terminal in VS Code (`Ctrl+` ` `) and run:

```bash
# Go into the backend folder
cd backend

# Install dependencies
npm install

# Copy the environment file
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Start the backend server
npm run dev
```

You should see:
```
🚀  SQL Master API running on http://localhost:4000
📦  Database: sqlmaster.db
🔑  Default admin password: admin@123
```

The first run will automatically:
- Create `sqlmaster.db` (SQLite database file)
- Seed all cleaning questions, JOIN questions, and interview questions
- Set the default admin password to `admin@123`

### Step 4 — Set up the Frontend

Open a **second terminal** in VS Code (`Ctrl+Shift+` ` ` opens a new terminal):

```bash
# Go into the frontend folder
cd frontend

# Install dependencies
npm install

# Copy the environment file
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Start the frontend dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5 — Open in Browser

Go to: **http://localhost:5173**

---

## ✅ Features

| Feature | Description |
|---|---|
| 🧹 Data Cleaning | 200+ SQL challenges on dirty data |
| 🔗 SQL JOINs | 50 new JOIN questions (Basic → Complex) |
| ⚡ Playground | AI-powered SQL sandbox |
| 🎯 Interview Prep | Real questions from Amazon, Google, Meta, etc. |
| 📊 Progress | XP, badges, streaks, level tracking |
| ⚙️ Admin Panel | Add/edit/delete questions for all 3 categories |
| 🔐 Auth | JWT tokens, bcrypt hashed passwords, lockout protection |
| 💾 Persistence | Progress saved in localStorage, questions in SQLite |

---

## 🔐 Admin Panel

1. Click **Admin** in the sidebar
2. Enter password: `admin@123`
3. You can now:
   - Add/Edit/Delete Cleaning Questions
   - Add/Edit/Delete JOIN Questions ← **New!**
   - Add/Edit/Delete Interview Questions
   - View statistics
   - Change your admin password

**To change the password:**
Admin → Settings → Change Admin Password

The password is hashed with bcrypt and stored in SQLite — it is never stored in plain text.

---

## 🐛 Bugs Fixed

1. **No "Next Question" button** — Added Prev/Next navigation on every question page, plus a bottom navigation bar
2. **Password reset wiped all data** — Progress is now saved in localStorage separately from app state; changing admin password does NOT affect question data or user progress
3. **Data wipe on refresh** — All progress (XP, solved questions, streaks) persists via localStorage
4. **JOINs questions not in Admin** — Admin panel now has a full "JOINs" tab to add/edit/delete join questions

---

## 🌐 Deploying to Production

### Option A — Render.com (Free, Recommended)

**Backend:**
1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Select your repo, set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add Environment Variables:
   - `JWT_SECRET` = (any long random string, e.g. generate at https://randomkeygen.com)
   - `FRONTEND_URL` = (your frontend URL once deployed)
   - `NODE_ENV` = `production`
5. Deploy — note the backend URL (e.g. `https://sql-master-api.onrender.com`)

**Frontend:**
1. New → Static Site
2. Select your repo, set:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = your backend URL from step above
4. Deploy — you get a URL like `https://sql-master.onrender.com`

### Option B — Railway.app

Similar to Render. Create two services (backend + frontend) from the same repo.

### Option C — Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npm install -g vercel
vercel
# Follow prompts, set VITE_API_URL env var to your backend URL
```

**Backend on Railway:**
1. Create new project → Deploy from GitHub
2. Set root to `backend/`
3. Add environment variables (JWT_SECRET, FRONTEND_URL)

### Option D — VPS (DigitalOcean / Linode)

```bash
# On your server:
git clone <your-repo> sql-master
cd sql-master

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your actual values
nano .env

# Install PM2 to keep backend running
npm install -g pm2
pm2 start server.js --name sql-master-api
pm2 save

# Frontend — build and serve static files
cd ../frontend
npm install
echo "VITE_API_URL=https://your-domain.com" > .env
npm run build
# Built files go to ../backend/public/
# Serve with nginx or express static files

# Install nginx
sudo apt install nginx
# Configure nginx to proxy /api to localhost:4000
# and serve frontend build for everything else
```

---

## 🔧 Common Issues

**Port already in use:**
```bash
# Kill process on port 4000
npx kill-port 4000
# Or on Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

**npm install fails:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install
```

**Backend not connecting:**
- Make sure backend is running (`npm run dev` in `backend/` folder)
- Check `.env` file exists in `frontend/` with `VITE_API_URL=http://localhost:4000`
- The frontend works in **offline mode** even without backend — data is saved to localStorage

**"Cannot find module 'better-sqlite3'":**
```bash
cd backend
npm install better-sqlite3 --build-from-source
```

---

## 🗃️ Database

The app uses **SQLite** via `better-sqlite3`. The database file `sqlmaster.db` is created automatically in the `backend/` folder on first run.

Tables:
- `cleaning_questions` — Data cleaning challenges
- `join_questions` — SQL JOIN challenges (new!)
- `interview_questions` — Interview prep questions
- `settings` — Admin password hash (bcrypt)

To reset to default data, simply delete `sqlmaster.db` and restart the backend.

---

## 📝 Environment Variables

**Backend (`backend/.env`):**
```
PORT=4000
JWT_SECRET=your_long_random_secret_here
DB_PATH=./sqlmaster.db
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:4000
```

---

## 🛡️ Security Notes

- Admin passwords are hashed with **bcrypt** (10 rounds)
- Admin sessions use **JWT tokens** (12 hour expiry)
- Login has **brute-force protection** (3 attempts → 30s lockout)
- Tokens are stored in **localStorage** (cleared on logout)
- All admin write operations require a valid JWT
- For production, always set a strong `JWT_SECRET` in your environment

---

Built with React, Vite, Express, SQLite, and ❤️
