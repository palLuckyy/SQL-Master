// server.js — SQL Master API (uses lowdb, pure JS, no native build)
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const path     = require("path");
const { getDb, nextId } = require("./db");

const app  = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "sqlmaster_dev_secret_CHANGE_IN_PROD";

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

// Serve built frontend (for production single-server deploy)
const publicDir = path.join(__dirname, "public");
const fs = require("fs");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ── Auth Middleware ──────────────────────────────────────────────────────────
function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.admin = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}

// ── Auth Routes ──────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  const db = await getDb();
  if (!bcrypt.compareSync(password, db.data.settings.admin_pass_hash || "")) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

app.put("/api/auth/password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both fields required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Minimum 6 characters" });
  const db = await getDb();
  if (!bcrypt.compareSync(currentPassword, db.data.settings.admin_pass_hash)) {
    return res.status(401).json({ error: "Current password incorrect" });
  }
  db.data.settings.admin_pass_hash = bcrypt.hashSync(newPassword, 10);
  await db.write();
  res.json({ success: true });
});

// Helper to wire up routes with async handlers
function route(router, method, path, ...handlers) {
  router[method](path, ...handlers.map(h => async (req, res, next) => {
    try { await h(req, res, next); } catch(e) { res.status(500).json({ error: e.message }); }
  }));
}

// ── Cleaning Questions ───────────────────────────────────────────────────────
const cCols = ["cat","q","difficulty","sol"];
route(app, "get",    "/api/questions/cleaning",      async (req,res) => { const db=await getDb(); res.json(db.data.cleaning_questions); });
route(app, "post",   "/api/questions/cleaning",      authRequired, async (req,res) => {
  const db=await getDb(); const id=nextId(db,"_cleaningSeq"); const item={id,...pick(req.body,cCols)};
  db.data.cleaning_questions.push(item); await db.write(); res.status(201).json(item);
});
route(app, "put",    "/api/questions/cleaning/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const idx=db.data.cleaning_questions.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({error:"Not found"});
  db.data.cleaning_questions[idx]={...db.data.cleaning_questions[idx],...pick(req.body,cCols)};
  await db.write(); res.json(db.data.cleaning_questions[idx]);
});
route(app, "delete", "/api/questions/cleaning/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const before=db.data.cleaning_questions.length;
  db.data.cleaning_questions=db.data.cleaning_questions.filter(x=>x.id!==id);
  if(db.data.cleaning_questions.length===before) return res.status(404).json({error:"Not found"});
  await db.write(); res.json({success:true,id});
});

// ── Join Questions ───────────────────────────────────────────────────────────
const jCols = ["cat","q","difficulty","sol"];
route(app, "get",    "/api/questions/joins",      async (req,res) => { const db=await getDb(); res.json(db.data.join_questions); });
route(app, "post",   "/api/questions/joins",      authRequired, async (req,res) => {
  const db=await getDb(); const id=nextId(db,"_joinSeq"); const item={id,...pick(req.body,jCols)};
  db.data.join_questions.push(item); await db.write(); res.status(201).json(item);
});
route(app, "put",    "/api/questions/joins/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const idx=db.data.join_questions.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({error:"Not found"});
  db.data.join_questions[idx]={...db.data.join_questions[idx],...pick(req.body,jCols)};
  await db.write(); res.json(db.data.join_questions[idx]);
});
route(app, "delete", "/api/questions/joins/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const before=db.data.join_questions.length;
  db.data.join_questions=db.data.join_questions.filter(x=>x.id!==id);
  if(db.data.join_questions.length===before) return res.status(404).json({error:"Not found"});
  await db.write(); res.json({success:true,id});
});

// ── Interview Questions ──────────────────────────────────────────────────────
const iCols = ["company","q","cat","d"];
route(app, "get",    "/api/questions/interview",      async (req,res) => { const db=await getDb(); res.json(db.data.interview_questions); });
route(app, "post",   "/api/questions/interview",      authRequired, async (req,res) => {
  const db=await getDb(); const id=nextId(db,"_interviewSeq"); const item={id,...pick(req.body,iCols)};
  db.data.interview_questions.push(item); await db.write(); res.status(201).json(item);
});
route(app, "put",    "/api/questions/interview/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const idx=db.data.interview_questions.findIndex(x=>x.id===id);
  if(idx===-1) return res.status(404).json({error:"Not found"});
  db.data.interview_questions[idx]={...db.data.interview_questions[idx],...pick(req.body,iCols)};
  await db.write(); res.json(db.data.interview_questions[idx]);
});
route(app, "delete", "/api/questions/interview/:id",  authRequired, async (req,res) => {
  const db=await getDb(); const id=parseInt(req.params.id);
  const before=db.data.interview_questions.length;
  db.data.interview_questions=db.data.interview_questions.filter(x=>x.id!==id);
  if(db.data.interview_questions.length===before) return res.status(404).json({error:"Not found"});
  await db.write(); res.json({success:true,id});
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ status:"ok", time:new Date().toISOString() }));

// ── Catch-all for SPA (must be last) ─────────────────────────────────────────
if (fs.existsSync(publicDir)) {
  app.get("*", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

// ── Helper ────────────────────────────────────────────────────────────────────
function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k] ?? "";
  return out;
}

// ── Start ──────────────────────────────────────────────────────────────────────
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  SQL Master API  →  http://localhost:${PORT}`);
    console.log(`📦  Database: ${process.env.DB_PATH || "sqlmaster.json"}`);
    console.log(`🔑  Default admin password: admin@123\n`);
  });
});
