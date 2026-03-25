// server.js — SQL Master API with User Auth + OTP + Progress Tracking
require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path       = require("path");
const fs         = require("fs");
const { getDb, nextId } = require("./db");

const app  = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET  = process.env.JWT_SECRET  || "sqlmaster_dev_secret_CHANGE_IN_PROD";
const USER_SECRET = process.env.USER_SECRET || "sqlmaster_user_secret_CHANGE_IN_PROD";

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Serve built frontend
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

// ── Email Transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

async function sendOtpEmail(email, otp, name) {
  if (!process.env.EMAIL_USER) {
    console.log(`[DEV] OTP for ${email}: ${otp}`); // Log in dev if no email configured
    return;
  }
  await transporter.sendMail({
    from: `"SQL Master" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your SQL Master OTP Code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1220;color:#e2e8f0;border-radius:12px;">
        <h1 style="color:#38bdf8;font-size:24px;margin:0 0 8px;">SQL<span style="color:#e2e8f0;">Master</span></h1>
        <p style="color:#64748b;margin:0 0 28px;font-size:13px;">LEARN · PRACTICE · MASTER</p>
        <p style="font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;color:#94a3b8;">Your verification code is:</p>
        <div style="background:#151f30;border:1px solid #1e2d45;border-radius:10px;padding:24px;text-align:center;margin:20px 0;">
          <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#38bdf8;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:13px;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
        <p style="color:#64748b;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Admin Auth Middleware ─────────────────────────────────────────────────────
function adminRequired(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}

// ── User Auth Middleware ──────────────────────────────────────────────────────
function userRequired(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Login required" });
  try { req.user = jwt.verify(token, USER_SECRET); next(); }
  catch { return res.status(401).json({ error: "Session expired, please login again" }); }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k] ?? "";
  return out;
}

function route(router, method, path, ...handlers) {
  router[method](path, ...handlers.map(h => async (req, res, next) => {
    try { await h(req, res, next); } catch(e) {
      console.error(e.message);
      res.status(500).json({ error: e.message });
    }
  }));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ════════════════════════════════════════════════════════════════════════════
// USER AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── Signup ───────────────────────────────────────────────────────────────────
route(app, "post", "/api/user/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email address" });

  const db = await getDb();
  const existing = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing && existing.verified)
    return res.status(409).json({ error: "Email already registered. Please login." });

  const otp      = generateOtp();
  const otpExp   = Date.now() + 10 * 60 * 1000; // 10 minutes
  const passHash = bcrypt.hashSync(password, 10);

  if (existing && !existing.verified) {
    // Resend OTP for unverified account
    existing.otp = otp; existing.otp_expires = otpExp;
    existing.name = name; existing.password_hash = passHash;
  } else {
    const id = nextId(db, "_userSeq");
    db.data.users.push({
      id, name, email: email.toLowerCase(),
      password_hash: passHash,
      otp, otp_expires: otpExp,
      verified: false,
      created_at: new Date().toISOString(),
      last_login: null,
    });
  }
  await db.write();
  await sendOtpEmail(email, otp, name);
  res.json({ success: true, message: "OTP sent to your email" });
});

// ── Verify OTP ────────────────────────────────────────────────────────────────
route(app, "post", "/api/user/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const db = await getDb();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.verified) return res.status(400).json({ error: "Already verified. Please login." });
  if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
  if (Date.now() > user.otp_expires) return res.status(400).json({ error: "OTP expired. Request a new one." });

  user.verified   = true;
  user.otp        = null;
  user.otp_expires = null;
  user.last_login = new Date().toISOString();

  // Create default progress
  if (!db.data.user_progress.find(p => p.user_id === user.id)) {
    db.data.user_progress.push({
      user_id:     user.id,
      xp:          0,
      streak:      0,
      solved_q:    [],
      solved_j:    [],
      done_lessons:[],
      last_active: todayStr(),
      daily_streak_updated: null,
    });
  }
  await db.write();

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, USER_SECRET, { expiresIn: "7d" });
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
});

// ── Resend OTP ────────────────────────────────────────────────────────────────
route(app, "post", "/api/user/resend-otp", async (req, res) => {
  const { email } = req.body;
  const db = await getDb();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.verified) return res.status(400).json({ error: "Already verified" });

  user.otp = generateOtp();
  user.otp_expires = Date.now() + 10 * 60 * 1000;
  await db.write();
  await sendOtpEmail(email, user.otp, user.name);
  res.json({ success: true, message: "New OTP sent" });
});

// ── Login ─────────────────────────────────────────────────────────────────────
route(app, "post", "/api/user/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = await getDb();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: "No account found with this email" });
  if (!user.verified) return res.status(403).json({ error: "Email not verified", needsVerification: true, email });
  if (!bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Incorrect password" });

  // Update last login + streak
  const progress = db.data.user_progress.find(p => p.user_id === user.id);
  if (progress) {
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (progress.last_active === yesterday) {
      progress.streak = (progress.streak || 0) + 1;
    } else if (progress.last_active !== today) {
      progress.streak = 1;
    }
    progress.last_active = today;
  }
  user.last_login = new Date().toISOString();
  await db.write();

  // Pick daily question
  const allQ = [...db.data.cleaning_questions, ...db.data.join_questions];
  const solvedIds = new Set((progress?.solved_q || []).concat(progress?.solved_j || []));
  const unsolved = allQ.filter(q => !solvedIds.has(q.id));
  const dailyQ = unsolved.length > 0
    ? unsolved[Math.floor(Math.random() * Math.min(unsolved.length, 20))]
    : allQ[Math.floor(Math.random() * allQ.length)];

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, USER_SECRET, { expiresIn: "7d" });
  res.json({
    success: true, token,
    user: { id: user.id, name: user.name, email: user.email },
    dailyQuestion: dailyQ,
    progress: progress || null,
  });
});

// ── Forgot Password (send OTP) ────────────────────────────────────────────────
route(app, "post", "/api/user/forgot-password", async (req, res) => {
  const { email } = req.body;
  const db = await getDb();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(404).json({ error: "No account with this email" });

  user.otp = generateOtp();
  user.otp_expires = Date.now() + 10 * 60 * 1000;
  user.reset_mode = true;
  await db.write();
  await sendOtpEmail(email, user.otp, user.name);
  res.json({ success: true, message: "Password reset OTP sent" });
});

// ── Reset Password ────────────────────────────────────────────────────────────
route(app, "post", "/api/user/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const db = await getDb();
  const user = db.data.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
  if (Date.now() > user.otp_expires) return res.status(400).json({ error: "OTP expired" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Min 6 characters" });

  user.password_hash = bcrypt.hashSync(newPassword, 10);
  user.otp = null; user.otp_expires = null; user.reset_mode = false;
  await db.write();
  res.json({ success: true, message: "Password reset successfully" });
});

// ── Get My Profile + Progress ─────────────────────────────────────────────────
route(app, "get", "/api/user/me", userRequired, async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const progress = db.data.user_progress.find(p => p.user_id === req.user.id) || {};
  res.json({ user: { id:user.id, name:user.name, email:user.email, created_at:user.created_at, last_login:user.last_login }, progress });
});

// ── Save Progress ─────────────────────────────────────────────────────────────
route(app, "put", "/api/user/progress", userRequired, async (req, res) => {
  const { xp, solved_q, solved_j, done_lessons, streak } = req.body;
  const db = await getDb();
  let p = db.data.user_progress.find(p => p.user_id === req.user.id);
  if (!p) {
    p = { user_id: req.user.id, xp:0, streak:0, solved_q:[], solved_j:[], done_lessons:[], last_active: todayStr() };
    db.data.user_progress.push(p);
  }
  if (xp          !== undefined) p.xp           = xp;
  if (solved_q    !== undefined) p.solved_q      = solved_q;
  if (solved_j    !== undefined) p.solved_j      = solved_j;
  if (done_lessons!== undefined) p.done_lessons  = done_lessons;
  if (streak      !== undefined) p.streak        = streak;
  p.last_active = todayStr();
  await db.write();
  res.json({ success: true, progress: p });
});

// ── Daily Question completed ──────────────────────────────────────────────────
route(app, "post", "/api/user/daily-done", userRequired, async (req, res) => {
  const { questionId, score } = req.body;
  const db = await getDb();
  db.data.daily_completions.push({
    user_id: req.user.id, question_id: questionId,
    score, date: todayStr(), ts: new Date().toISOString()
  });
  await db.write();
  res.json({ success: true });
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
route(app, "get", "/api/leaderboard", async (req, res) => {
  const db = await getDb();
  const board = db.data.user_progress.map(p => {
    const u = db.data.users.find(u => u.id === p.user_id);
    return {
      name:        u?.name || "Unknown",
      xp:          p.xp || 0,
      solved:      (p.solved_q?.length || 0) + (p.solved_j?.length || 0),
      streak:      p.streak || 0,
      last_active: p.last_active,
    };
  }).sort((a, b) => b.xp - a.xp).slice(0, 20);
  res.json(board);
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

route(app, "post", "/api/auth/login", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  const db = await getDb();
  if (!bcrypt.compareSync(password, db.data.settings.admin_pass_hash || ""))
    return res.status(401).json({ error: "Incorrect password" });
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

route(app, "put", "/api/auth/password", adminRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both fields required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Minimum 6 characters" });
  const db = await getDb();
  if (!bcrypt.compareSync(currentPassword, db.data.settings.admin_pass_hash))
    return res.status(401).json({ error: "Current password incorrect" });
  db.data.settings.admin_pass_hash = bcrypt.hashSync(newPassword, 10);
  await db.write();
  res.json({ success: true });
});

// ── Admin: All Users + Performance ───────────────────────────────────────────
route(app, "get", "/api/admin/users", adminRequired, async (req, res) => {
  const db = await getDb();
  const users = db.data.users.filter(u => u.verified).map(u => {
    const p = db.data.user_progress.find(p => p.user_id === u.id) || {};
    const dailyDone = db.data.daily_completions.filter(d => d.user_id === u.id).length;
    return {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      created_at:  u.created_at,
      last_login:  u.last_login,
      xp:          p.xp || 0,
      streak:      p.streak || 0,
      solved_cleaning: p.solved_q?.length || 0,
      solved_joins:    p.solved_j?.length || 0,
      lessons_done:    p.done_lessons?.length || 0,
      daily_done:      dailyDone,
      last_active:     p.last_active || null,
    };
  });
  res.json({ total: users.length, users });
});

route(app, "get", "/api/admin/stats", adminRequired, async (req, res) => {
  const db = await getDb();
  const verified = db.data.users.filter(u => u.verified);
  const today = todayStr();
  const activeToday = db.data.user_progress.filter(p => p.last_active === today).length;
  const totalXP = db.data.user_progress.reduce((sum, p) => sum + (p.xp || 0), 0);
  const totalSolved = db.data.user_progress.reduce((sum, p) =>
    sum + (p.solved_q?.length || 0) + (p.solved_j?.length || 0), 0);
  res.json({ total_users: verified.length, active_today: activeToday, total_xp: totalXP, total_solved: totalSolved });
});

// ════════════════════════════════════════════════════════════════════════════
// QUESTION CRUD ROUTES (admin protected)
// ════════════════════════════════════════════════════════════════════════════
const cCols = ["cat","q","difficulty","sol"];
const jCols = ["cat","q","difficulty","sol"];
const iCols = ["company","q","cat","d"];

route(app,"get",   "/api/questions/cleaning",     async(req,res)=>{const db=await getDb();res.json(db.data.cleaning_questions);});
route(app,"post",  "/api/questions/cleaning",     adminRequired,async(req,res)=>{const db=await getDb();const id=nextId(db,"_cleaningSeq");const item={id,...pick(req.body,cCols)};db.data.cleaning_questions.push(item);await db.write();res.status(201).json(item);});
route(app,"put",   "/api/questions/cleaning/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const idx=db.data.cleaning_questions.findIndex(x=>x.id===id);if(idx===-1)return res.status(404).json({error:"Not found"});db.data.cleaning_questions[idx]={...db.data.cleaning_questions[idx],...pick(req.body,cCols)};await db.write();res.json(db.data.cleaning_questions[idx]);});
route(app,"delete","/api/questions/cleaning/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const before=db.data.cleaning_questions.length;db.data.cleaning_questions=db.data.cleaning_questions.filter(x=>x.id!==id);if(db.data.cleaning_questions.length===before)return res.status(404).json({error:"Not found"});await db.write();res.json({success:true,id});});

route(app,"get",   "/api/questions/joins",     async(req,res)=>{const db=await getDb();res.json(db.data.join_questions);});
route(app,"post",  "/api/questions/joins",     adminRequired,async(req,res)=>{const db=await getDb();const id=nextId(db,"_joinSeq");const item={id,...pick(req.body,jCols)};db.data.join_questions.push(item);await db.write();res.status(201).json(item);});
route(app,"put",   "/api/questions/joins/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const idx=db.data.join_questions.findIndex(x=>x.id===id);if(idx===-1)return res.status(404).json({error:"Not found"});db.data.join_questions[idx]={...db.data.join_questions[idx],...pick(req.body,jCols)};await db.write();res.json(db.data.join_questions[idx]);});
route(app,"delete","/api/questions/joins/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const before=db.data.join_questions.length;db.data.join_questions=db.data.join_questions.filter(x=>x.id!==id);if(db.data.join_questions.length===before)return res.status(404).json({error:"Not found"});await db.write();res.json({success:true,id});});

route(app,"get",   "/api/questions/interview",     async(req,res)=>{const db=await getDb();res.json(db.data.interview_questions);});
route(app,"post",  "/api/questions/interview",     adminRequired,async(req,res)=>{const db=await getDb();const id=nextId(db,"_interviewSeq");const item={id,...pick(req.body,iCols)};db.data.interview_questions.push(item);await db.write();res.status(201).json(item);});
route(app,"put",   "/api/questions/interview/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const idx=db.data.interview_questions.findIndex(x=>x.id===id);if(idx===-1)return res.status(404).json({error:"Not found"});db.data.interview_questions[idx]={...db.data.interview_questions[idx],...pick(req.body,iCols)};await db.write();res.json(db.data.interview_questions[idx]);});
route(app,"delete","/api/questions/interview/:id", adminRequired,async(req,res)=>{const db=await getDb();const id=parseInt(req.params.id);const before=db.data.interview_questions.length;db.data.interview_questions=db.data.interview_questions.filter(x=>x.id!==id);if(db.data.interview_questions.length===before)return res.status(404).json({error:"Not found"});await db.write();res.json({success:true,id});});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status:"ok", time:new Date().toISOString() }));

// SPA fallback
if (fs.existsSync(publicDir)) {
  app.get("*", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

// ── Start ──────────────────────────────────────────────────────────────────────
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  SQL Master API  →  http://localhost:${PORT}`);
    console.log(`📧  Email OTP: ${process.env.EMAIL_USER ? "configured" : "DEV MODE (OTP printed to console)"}`);
    console.log(`🔑  Admin password: admin@123\n`);
  });
});
