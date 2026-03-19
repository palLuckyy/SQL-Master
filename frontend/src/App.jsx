import { useState, useRef, useCallback, useEffect } from "react";
import { API, saveToken, clearToken } from "./api.js";
import CurriculumView from "./Learn.jsx";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#080c14", sidebar:"#0d1220", surface:"#111827", card:"#151f30",
  cardHov:"#1a2640", border:"#1e2d45", border2:"#243350", accent:"#38bdf8",
  accentDk:"#0ea5e9", purple:"#8b5cf6", green:"#22c55e", orange:"#f59e0b",
  red:"#ef4444", pink:"#ec4899", muted:"#334155", text:"#e2e8f0",
  dim:"#64748b", dim2:"#94a3b8", teal:"#14b8a6",
};

// ─── COLORS ───────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Exploration":"#06b6d4","Duplicates":"#f43f5e","String Cleaning":"#8b5cf6",
  "Standardization":"#f59e0b","Date Cleaning":"#10b981","Numeric":"#3b82f6",
  "NULL Handling":"#ec4899","Validation":"#6366f1","Final Cleaning":"#14b8a6",
};
const JOIN_CAT_COLORS = {
  "Basic Joins":"#38bdf8","Aggregation Joins":"#8b5cf6","Filtered Joins":"#22c55e",
  "Self Joins":"#f59e0b","Advanced Joins":"#ec4899","Complex Joins":"#ef4444",
};
const DIFF_COLOR = {
  Beginner:"#22c55e", Intermediate:"#f59e0b", Advanced:"#ef4444", Expert:"#8b5cf6",
  Easy:"#22c55e", Medium:"#f59e0b", Hard:"#ef4444",
};
const CO_COLOR = {
  Amazon:"#f59e0b",Google:"#4ade80",Meta:"#60a5fa",Microsoft:"#a78bfa",
  Netflix:"#f87171",Uber:"#94a3b8",Airbnb:"#fb923c",Twitter:"#38bdf8",
  Stripe:"#818cf8",LinkedIn:"#2563eb",Apple:"#e2e8f0",Other:"#64748b",
};
const INTERVIEW_CATS = ["All","Window Functions","DENSE_RANK","Self Join","Subquery","CTE + ROW_NUMBER","Aggregation","Correlated Subquery","General"];
const INTERVIEW_DIFFS = ["All","Easy","Medium","Hard","Expert"];

// ─── FALLBACK DATA (used if backend is unreachable) ───────────────────────────
const FALLBACK_CLEANING = [
  {id:1,cat:"Exploration",q:"Count total records in customers_raw.",difficulty:"Beginner",sol:"SELECT COUNT(*) AS total_records\nFROM customers_raw;"},
  {id:2,cat:"Exploration",q:"Find distinct customer_id values.",difficulty:"Beginner",sol:"SELECT DISTINCT customer_id\nFROM customers_raw\nORDER BY customer_id;"},
  {id:3,cat:"Duplicates",q:"Find duplicate rows (fully identical).",difficulty:"Intermediate",sol:"SELECT *, COUNT(*) AS dup_count\nFROM customers_raw\nGROUP BY customer_id,first_name,last_name,email,phone\nHAVING COUNT(*) > 1;"},
  {id:4,cat:"String Cleaning",q:"Remove leading spaces from the notes column.",difficulty:"Beginner",sol:"UPDATE customers_raw\nSET notes = LTRIM(notes)\nWHERE notes IS NOT NULL;"},
  {id:5,cat:"Date Cleaning",q:"Convert birth_date VARCHAR to proper DATE format.",difficulty:"Advanced",sol:"SELECT customer_id, birth_date,\n  CASE\n    WHEN birth_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(birth_date,'YYYY-MM-DD')\n    WHEN birth_date ~ '^\\d{2}/\\d{2}/\\d{4}$' THEN TO_DATE(birth_date,'MM/DD/YYYY')\n    ELSE NULL\n  END AS clean_birth_date\nFROM customers_raw;"},
];

const FALLBACK_JOINS = [
  {id:1,cat:"Basic Joins",q:"Write a query to display employee name and department name.",difficulty:"Beginner",sol:"SELECT e.emp_name, d.dept_name\nFROM employees e\nINNER JOIN departments d ON e.dept_id = d.dept_id;"},
  {id:2,cat:"Basic Joins",q:"Write a query to list employees who do not belong to any department.",difficulty:"Beginner",sol:"SELECT e.emp_name\nFROM employees e\nLEFT JOIN departments d ON e.dept_id = d.dept_id\nWHERE d.dept_id IS NULL;"},
  {id:3,cat:"Basic Joins",q:"Write a query to find departments that have no employees.",difficulty:"Beginner",sol:"SELECT d.dept_name\nFROM departments d\nLEFT JOIN employees e ON d.dept_id = e.dept_id\nWHERE e.emp_id IS NULL;"},
  {id:4,cat:"Self Joins",q:"Write a query to display employees and their managers.",difficulty:"Intermediate",sol:"SELECT e.emp_name AS employee,\n       COALESCE(m.emp_name,'No Manager') AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.emp_id;"},
  {id:5,cat:"Complex Joins",q:"Write a query to find the second highest salary in each department.",difficulty:"Advanced",sol:"SELECT emp_name, salary, dept_name\nFROM (\n  SELECT e.emp_name, e.salary, d.dept_name,\n    DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary DESC) AS dr\n  FROM employees e JOIN departments d ON e.dept_id = d.dept_id\n) ranked\nWHERE dr = 2;"},
];

const FALLBACK_INTERVIEW = [
  {id:1,company:"Amazon",q:"Find customers with purchases in 3 consecutive months.",cat:"Window Functions",d:"Hard"},
  {id:2,company:"Google",q:"Find the 2nd highest income customer in each segment.",cat:"DENSE_RANK",d:"Medium"},
  {id:3,company:"Meta",q:"Find users who logged in on Jan 1 AND Jan 2.",cat:"Self Join",d:"Medium"},
];

// ─── LOCAL STORAGE HELPERS ────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function progressFromLS() {
  const raw = lsGet("sm_progress", null);
  if (!raw) return { xp:0, streak:0, doneLessons:new Set(), solvedQ:new Set(), solvedJ:new Set() };
  return {
    xp: raw.xp || 0,
    streak: raw.streak || 0,
    doneLessons: new Set(raw.doneLessons || []),
    solvedQ: new Set(raw.solvedQ || []),
    solvedJ: new Set(raw.solvedJ || []),
  };
}
function progressToLS(p) {
  lsSet("sm_progress", {
    xp: p.xp, streak: p.streak,
    doneLessons: [...p.doneLessons],
    solvedQ: [...p.solvedQ],
    solvedJ: [...p.solvedJ],
  });
}

// ─── SMALL UI COMPONENTS ──────────────────────────────────────────────────────
function Pill({ label, color }) {
  return (
    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
      background:color+"20", color, border:`1px solid ${color}40` }}>{label}</span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14,
      ...style }}>{children}</div>
  );
}

function Btn({ children, onClick, color=T.accent, outline=false, disabled=false, small=false }) {
  const base = { padding: small?"6px 14px":"10px 22px", borderRadius:10, fontWeight:700,
    fontSize:small?12:14, cursor:disabled?"not-allowed":"pointer", transition:"all .15s",
    opacity:disabled?.5:1, border:"none" };
  return outline
    ? <button onClick={disabled?undefined:onClick} style={{ ...base, background:"transparent",
        color, border:`1.5px solid ${color}60` }}>{children}</button>
    : <button onClick={disabled?undefined:onClick} style={{ ...base, background:color,
        color:"#000", boxShadow:`0 4px 14px ${color}35` }}>{children}</button>;
}

function SqlEditor({ value, onChange, minH=180 }) {
  const ref = useRef(null);
  const handleTab = e => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const s = e.target.selectionStart, end = e.target.selectionEnd;
    const nv = value.slice(0,s) + "  " + value.slice(end);
    onChange(nv);
    setTimeout(() => { ref.current.selectionStart = ref.current.selectionEnd = s + 2; });
  };
  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${T.border2}` }}>
      <div style={{ background:"#050810", padding:"8px 16px", display:"flex", justifyContent:"space-between",
        alignItems:"center", borderBottom:`1px solid ${T.border2}` }}>
        <div style={{ display:"flex", gap:6 }}>
          {["#ef4444","#f59e0b",T.green].map((c,i)=>(
            <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }} />
          ))}
          <span style={{ color:T.dim, fontSize:11, fontFamily:"monospace", marginLeft:6 }}>query.sql</span>
        </div>
        <span style={{ color:T.dim, fontSize:11 }}>Tab = 2 spaces</span>
      </div>
      <textarea ref={ref} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={handleTab}
        style={{ width:"100%", minHeight:minH, background:"#05080f", color:"#7dd3fc",
          fontFamily:"'Fira Code','Cascadia Code','Courier New',monospace",
          fontSize:13, lineHeight:1.8, border:"none", padding:"18px 20px",
          boxSizing:"border-box", outline:"none", resize:"vertical", caretColor:T.accent }} />
    </div>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div style={{ position:"relative", background:"#05080f", borderRadius:10, border:`1px solid ${T.border2}` }}>
      <button onClick={copy} style={{ position:"absolute", top:10, right:12, background:T.card,
        border:`1px solid ${T.border2}`, borderRadius:6, color:copied?T.green:T.dim,
        cursor:"pointer", fontSize:11, fontWeight:700, padding:"4px 10px" }}>
        {copied?"✓ Copied":"Copy"}
      </button>
      <pre style={{ margin:0, padding:"20px 24px", paddingRight:72, color:T.text, fontSize:13,
        lineHeight:1.8, fontFamily:"'Fira Code','Courier New',monospace",
        whiteSpace:"pre-wrap", wordBreak:"break-word", overflowX:"auto" }}>{code}</pre>
    </div>
  );
}

// ─── SQL EVALUATOR ────────────────────────────────────────────────────────────
function evalSQL(userRaw, solRaw, questionText) {
  const norm = s => s.replace(/--[^\n]*/g,"").replace(/\s+/g," ").trim().toLowerCase();
  const u = norm(userRaw), s = norm(solRaw);
  if (u === s) return { score:100, correct:true, feedback:"Perfect match! Your query is exactly right.", hint:"" };
  const tokens = str => new Set(str.match(/\b\w+\b/g)||[]);
  const uTok = tokens(u), sTok = tokens(s);
  const sqlKeywords = new Set(["select","from","where","group","by","having","order","limit","join","on","as","and","or","not","in","like","between","is","null","count","sum","avg","min","max","distinct","with","case","when","then","else","end","insert","update","delete","create","drop","alter","set","into","values","inner","left","right","full","outer","cross","union","except","intersect","over","partition","rank","row_number","dense_rank","coalesce","nullif","trim","lower","upper","initcap","replace","substring","regexp_replace","extract","to_date","cast","ilike","exists","offset"]);
  const sImportant = [...sTok].filter(t=>!["the","a","an","is"].includes(t));
  const matches = sImportant.filter(t=>uTok.has(t)).length;
  const rawScore = sImportant.length>0?Math.round(matches/sImportant.length*100):0;
  let bonus=0;
  const structureKeys=["select","from","where","group","having","order","join","with","over","exists","partition"];
  const sStruct=structureKeys.filter(k=>sTok.has(k));
  const uStruct=structureKeys.filter(k=>uTok.has(k));
  const structMatch=sStruct.filter(k=>uStruct.includes(k)).length;
  if(sStruct.length>0) bonus=Math.round(structMatch/sStruct.length*20);
  let score=Math.min(100,rawScore+bonus);
  const missing=[...sTok].filter(t=>sqlKeywords.has(t)&&!uTok.has(t));
  let feedback="", hint="";
  if(score>=90){ feedback="Excellent! Your query is logically correct."; hint=missing.length?`Minor note: solution also uses ${missing.slice(0,3).join(", ")}.`:""; }
  else if(score>=70){ feedback="Good approach! Your query captures the main idea."; hint=missing.length?`Consider adding: ${missing.slice(0,4).join(", ").toUpperCase()}.`:"Double-check column names."; }
  else if(score>=40){ feedback="Partially correct. Key parts are missing."; hint=missing.length?`Missing: ${missing.slice(0,5).join(", ").toUpperCase()}.`:"Review the expected structure."; }
  else{ feedback="Not quite there yet. Check the SQL structure needed."; hint=missing.length?`Key elements: ${missing.slice(0,6).join(", ").toUpperCase()}.`:"Try clicking 'Show Solution'."; }
  if(!uTok.has("select")&&!uTok.has("update")&&!uTok.has("delete")&&!uTok.has("create")&&!uTok.has("with"))
    return { score:0, correct:false, feedback:"Your answer doesn't look like a SQL query yet. Start with SELECT, UPDATE, DELETE, or WITH.", hint:`Expected: ${s.split(" ").slice(0,3).join(" ").toUpperCase()}...` };
  return { score, correct:score>=70, feedback, hint };
}

// ─── QUESTION VIEW (shared by Cleaning & Joins) ────────────────────────────────
function QuestionDetailView({ q, qList, onBack, onNavigate, progress, markSolved, solvedSet }) {
  const [userCode, setUserCode] = useState("");
  const [showSol,  setShowSol]  = useState(false);
  const [aiCheck,  setAiCheck]  = useState(null);
  const [checking, setChecking] = useState(false);

  const currentIdx = qList.findIndex(x => x.id === q.id);
  const prevQ = currentIdx > 0 ? qList[currentIdx - 1] : null;
  const nextQ = currentIdx < qList.length - 1 ? qList[currentIdx + 1] : null;

  const goTo = (target) => {
    setUserCode(""); setShowSol(false); setAiCheck(null); setChecking(false);
    onNavigate(target);
  };

  const checkSolution = () => {
    if (!userCode.trim()) return;
    setChecking(true); setAiCheck(null);
    setTimeout(() => {
      const result = evalSQL(userCode, q.sol, q.q);
      setAiCheck(result);
      if (result.correct) markSolved(q.id);
      setChecking(false);
    }, 600);
  };

  const isSolved = solvedSet.has(q.id);

  return (
    <div>
      {/* Navigation bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:T.accent,
          cursor:"pointer", fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          ← Back to Questions
        </button>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ color:T.dim, fontSize:12 }}>{currentIdx+1} / {qList.length}</span>
          <Btn onClick={()=>goTo(prevQ)} disabled={!prevQ} outline color={T.dim2} small>← Prev</Btn>
          <Btn onClick={()=>goTo(nextQ)} disabled={!nextQ} color={T.accent} small>Next →</Btn>
        </div>
      </div>

      <div style={{ maxWidth:860 }}>
        {/* Pills */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <Pill label={`Q${q.id}`} color={T.dim2} />
          <Pill label={q.cat} color={CAT_COLORS[q.cat] || JOIN_CAT_COLORS[q.cat] || T.accent} />
          <Pill label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
          {isSolved && <Pill label="✓ Solved" color={T.green} />}
        </div>

        <h2 style={{ color:T.text, fontSize:22, fontWeight:800, marginBottom:20, lineHeight:1.4 }}>{q.q}</h2>

        {/* Dataset info */}
        <div style={{ background:T.orange+"12", border:`1px solid ${T.orange}30`, borderRadius:10,
          padding:"12px 18px", marginBottom:28, fontSize:13, color:T.dim2 }}>
          <strong style={{ color:T.orange }}>🗃️ Tables:</strong>{" "}
          {q.cat && Object.keys(JOIN_CAT_COLORS).includes(q.cat)
            ? <><code style={{color:T.text}}>employees</code> · <code style={{color:T.text}}>departments</code> — standard HR schema with emp_id, emp_name, salary, dept_id, manager_id, hire_date</>
            : <><code style={{color:T.text}}>customers_raw</code> — intentionally dirty data with duplicates, NULLs, invalid formats</>
          }
        </div>

        {/* Editor */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <h3 style={{ margin:0, color:T.text, fontSize:15, fontWeight:700 }}>✍️ Write Your Solution</h3>
            <span style={{ color:T.dim, fontSize:12 }}>PostgreSQL dialect</span>
          </div>
          <SqlEditor value={userCode} onChange={setUserCode} minH={180} />
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          <Btn onClick={checkSolution} disabled={checking||!userCode.trim()} color={T.purple}>
            {checking?"⏳ Checking...":"✅ Check My Answer"}
          </Btn>
          <Btn onClick={()=>setShowSol(!showSol)} outline color={T.accent}>
            {showSol?"Hide Solution":"👁️ Show Solution"}
          </Btn>
          {!isSolved && (
            <Btn onClick={()=>markSolved(q.id)} color={T.green} outline>✓ Mark Solved (+30 XP)</Btn>
          )}
          <Btn onClick={()=>setUserCode("")} outline color={T.dim2} small>Clear</Btn>
          {nextQ && (
            <Btn onClick={()=>goTo(nextQ)} color={T.teal} small>Next Question →</Btn>
          )}
        </div>

        {/* Feedback */}
        {aiCheck && (
          <div style={{ borderRadius:12, border:`1px solid ${aiCheck.correct||aiCheck.score>=70?T.green:T.red}40`,
            background:(aiCheck.correct||aiCheck.score>=70?T.green:T.red)+"0d",
            padding:"18px 22px", marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
              <div style={{ fontSize:28 }}>{aiCheck.correct||aiCheck.score>=70?"✅":"❌"}</div>
              <div>
                <div style={{ color:T.text, fontWeight:700, fontSize:16 }}>
                  {aiCheck.correct||aiCheck.score>=70?"Great work!":"Not quite right"}
                </div>
                <div style={{ color:T.dim, fontSize:12 }}>Score: {aiCheck.score}/100</div>
              </div>
              <div style={{ marginLeft:"auto", minWidth:100 }}>
                <div style={{ height:8, borderRadius:99, background:T.muted }}>
                  <div style={{ height:"100%", borderRadius:99,
                    background:aiCheck.score>=70?T.green:aiCheck.score>=40?T.orange:T.red,
                    width:`${aiCheck.score}%`, transition:"width .6s" }} />
                </div>
              </div>
            </div>
            <p style={{ color:T.dim2, margin:"0 0 8px", fontSize:14, lineHeight:1.6 }}>{aiCheck.feedback}</p>
            {aiCheck.hint&&<p style={{ color:T.orange, margin:0, fontSize:13 }}>💡 <em>{aiCheck.hint}</em></p>}
          </div>
        )}

        {/* Solution */}
        {showSol && (
          <div style={{ marginBottom:8 }}>
            <div style={{ color:T.green, fontWeight:700, marginBottom:10, fontSize:15 }}>✓ Reference Solution</div>
            <CodeBlock code={q.sol} />
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:32, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
          <Btn onClick={()=>goTo(prevQ)} disabled={!prevQ} outline color={T.dim2}>← Previous Question</Btn>
          {nextQ
            ? <Btn onClick={()=>goTo(nextQ)} color={T.accent}>Next Question →</Btn>
            : <div style={{ color:T.green, fontWeight:700, fontSize:14, display:"flex", alignItems:"center" }}>🎉 Last question in this set!</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── CLEANING VIEW ─────────────────────────────────────────────────────────────
function CleaningView({ progress, setProgress, questions }) {
  const [openQ,   setOpenQ]  = useState(null);
  const [search,  setSearch] = useState("");
  const [cat,     setCat]    = useState("All");
  const [diff,    setDiff]   = useState("All");

  const markSolved = (id) => {
    setProgress(p => {
      const nS = new Set(p.solvedQ);
      if (!nS.has(id)) { nS.add(id); return { ...p, xp:p.xp+30, solvedQ:nS }; }
      return p;
    });
  };

  const cats = ["All", ...Object.keys(CAT_COLORS).filter(c => questions.some(q=>q.cat===c))];
  const filtered = questions.filter(q => {
    const ms = !search || q.q.toLowerCase().includes(search.toLowerCase());
    const mc = cat==="All"||q.cat===cat;
    const md = diff==="All"||q.difficulty===diff;
    return ms&&mc&&md;
  });

  if (openQ) return (
    <QuestionDetailView q={openQ} qList={filtered} onBack={()=>setOpenQ(null)}
      onNavigate={q => { if(q) setOpenQ(q); else setOpenQ(null); }}
      progress={progress} markSolved={markSolved} solvedSet={progress.solvedQ} />
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:24, fontWeight:800 }}>🧹 Data Cleaning Challenges</h2>
          <p style={{ margin:0, color:T.dim, fontSize:14 }}>
            {progress.solvedQ.size} of {questions.length} solved · Write SQL, get feedback, earn XP
          </p>
        </div>
        <Pill label={`${progress.solvedQ.size} / ${questions.length}`} color={T.accent} />
      </div>

      <Card style={{ padding:20, marginBottom:24 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search questions..."
          style={{ width:"100%", background:"#0a0f1e", border:`1px solid ${T.border2}`, borderRadius:8,
            padding:"10px 16px", color:T.text, fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }} />
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>CATEGORY</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontWeight:600, background:cat===c?(CAT_COLORS[c]||T.accent):"transparent",
                color:cat===c?"#000":T.dim, border:`1px solid ${cat===c?(CAT_COLORS[c]||T.accent):T.border2}` }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>DIFFICULTY</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["All","Beginner","Intermediate","Advanced","Expert"].map(d=>(
              <button key={d} onClick={()=>setDiff(d)} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontWeight:600, background:diff===d?(DIFF_COLOR[d]||T.accent):"transparent",
                color:diff===d?"#000":T.dim, border:`1px solid ${diff===d?(DIFF_COLOR[d]||T.accent):T.border2}` }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ marginBottom:16, color:T.dim, fontSize:13 }}>
        Showing <strong style={{ color:T.text }}>{filtered.length}</strong> of {questions.length} questions
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(q => {
          const solved = progress.solvedQ.has(q.id);
          return (
            <div key={q.id} onClick={()=>setOpenQ(q)}
              style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 22px",
                background:solved?T.green+"08":T.card, border:`1px solid ${solved?T.green+"40":T.border}`,
                borderRadius:12, cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=solved?T.green+"12":T.cardHov; e.currentTarget.style.borderColor=solved?T.green+"60":T.border2; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=solved?T.green+"08":T.card; e.currentTarget.style.borderColor=solved?T.green+"40":T.border; }}>
              <div style={{ width:44, height:44, borderRadius:10, background:solved?T.green+"20":T.muted+"40",
                border:`1px solid ${solved?T.green+"40":T.border}`, display:"flex", alignItems:"center",
                justifyContent:"center", fontWeight:800, fontSize:14, color:solved?T.green:T.dim, flexShrink:0 }}>
                {solved?"✓":q.id}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:T.text, fontWeight:600, fontSize:14, marginBottom:8, lineHeight:1.4 }}>{q.q}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Pill label={q.cat} color={CAT_COLORS[q.cat]||T.accent} />
                  <Pill label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
                </div>
              </div>
              <span style={{ color:T.dim, fontSize:14, flexShrink:0 }}>›</span>
            </div>
          );
        })}
        {filtered.length===0&&(
          <div style={{ textAlign:"center", padding:"60px 0", color:T.dim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>No questions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JOINS VIEW ────────────────────────────────────────────────────────────────
function JoinsView({ progress, setProgress, joinQuestions }) {
  const [openQ,  setOpenQ]  = useState(null);
  const [search, setSearch] = useState("");
  const [cat,    setCat]    = useState("All");
  const [diff,   setDiff]   = useState("All");

  const markSolved = (id) => {
    setProgress(p => {
      const nS = new Set(p.solvedJ);
      if (!nS.has(id)) { nS.add(id); return { ...p, xp:p.xp+40, solvedJ:nS }; }
      return p;
    });
  };

  const cats = ["All", ...Object.keys(JOIN_CAT_COLORS).filter(c=>joinQuestions.some(q=>q.cat===c))];
  const filtered = joinQuestions.filter(q => {
    const ms = !search||q.q.toLowerCase().includes(search.toLowerCase());
    const mc = cat==="All"||q.cat===cat;
    const md = diff==="All"||q.difficulty===diff;
    return ms&&mc&&md;
  });

  if (openQ) return (
    <QuestionDetailView q={openQ} qList={filtered} onBack={()=>setOpenQ(null)}
      onNavigate={q=>{ if(q) setOpenQ(q); else setOpenQ(null); }}
      progress={progress} markSolved={markSolved} solvedSet={progress.solvedJ||new Set()} />
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:24, fontWeight:800 }}>🔗 50 SQL JOIN Challenges</h2>
          <p style={{ margin:0, color:T.dim, fontSize:14 }}>
            {(progress.solvedJ||new Set()).size} of {joinQuestions.length} solved · employees & departments schema
          </p>
        </div>
        <Pill label={`${(progress.solvedJ||new Set()).size} / ${joinQuestions.length}`} color={T.teal} />
      </div>

      {/* Schema reference */}
      <Card style={{ padding:"16px 20px", marginBottom:20, background:T.teal+"08", border:`1px solid ${T.teal}30` }}>
        <div style={{ color:T.teal, fontWeight:700, fontSize:13, marginBottom:10 }}>📋 Schema Reference</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            { name:"employees", cols:"emp_id, emp_name, salary, dept_id, manager_id, hire_date" },
            { name:"departments", cols:"dept_id, dept_name, location" },
          ].map(t=>(
            <div key={t.name} style={{ background:"#05080f", borderRadius:8, padding:"10px 14px", border:`1px solid ${T.border2}` }}>
              <code style={{ color:T.accent, fontWeight:800 }}>{t.name}</code>
              <div style={{ color:T.dim2, fontSize:11, marginTop:4, fontFamily:"monospace" }}>{t.cols}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:20, marginBottom:24 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search join questions..."
          style={{ width:"100%", background:"#0a0f1e", border:`1px solid ${T.border2}`, borderRadius:8,
            padding:"10px 16px", color:T.text, fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }} />
        <div style={{ marginBottom:12 }}>
          <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>CATEGORY</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontWeight:600, background:cat===c?(JOIN_CAT_COLORS[c]||T.teal):"transparent",
                color:cat===c?"#000":T.dim, border:`1px solid ${cat===c?(JOIN_CAT_COLORS[c]||T.teal):T.border2}` }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>DIFFICULTY</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["All","Beginner","Intermediate","Advanced","Expert"].map(d=>(
              <button key={d} onClick={()=>setDiff(d)} style={{ padding:"5px 14px", borderRadius:20, cursor:"pointer",
                fontSize:12, fontWeight:600, background:diff===d?(DIFF_COLOR[d]||T.teal):"transparent",
                color:diff===d?"#000":T.dim, border:`1px solid ${diff===d?(DIFF_COLOR[d]||T.teal):T.border2}` }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ marginBottom:16, color:T.dim, fontSize:13 }}>
        Showing <strong style={{ color:T.text }}>{filtered.length}</strong> of {joinQuestions.length} questions
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(q => {
          const solved = (progress.solvedJ||new Set()).has(q.id);
          return (
            <div key={q.id} onClick={()=>setOpenQ(q)}
              style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 22px",
                background:solved?T.teal+"08":T.card, border:`1px solid ${solved?T.teal+"40":T.border}`,
                borderRadius:12, cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=solved?T.teal+"12":T.cardHov; e.currentTarget.style.borderColor=solved?T.teal+"60":T.border2; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=solved?T.teal+"08":T.card; e.currentTarget.style.borderColor=solved?T.teal+"40":T.border; }}>
              <div style={{ width:44, height:44, borderRadius:10, background:solved?T.teal+"20":T.muted+"40",
                border:`1px solid ${solved?T.teal+"40":T.border}`, display:"flex", alignItems:"center",
                justifyContent:"center", fontWeight:800, fontSize:14, color:solved?T.teal:T.dim, flexShrink:0 }}>
                {solved?"✓":q.id}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:T.text, fontWeight:600, fontSize:14, marginBottom:8, lineHeight:1.4 }}>{q.q}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Pill label={q.cat} color={JOIN_CAT_COLORS[q.cat]||T.teal} />
                  <Pill label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
                </div>
              </div>
              <span style={{ color:T.dim, fontSize:14, flexShrink:0 }}>›</span>
            </div>
          );
        })}
        {filtered.length===0&&(
          <div style={{ textAlign:"center", padding:"60px 0", color:T.dim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>No questions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PLAYGROUND ────────────────────────────────────────────────────────────────
const PRESETS = [
  { label:"Count all",       q:"SELECT COUNT(*) FROM customers_raw;" },
  { label:"NULL check",      q:"SELECT * FROM customers_raw WHERE email IS NULL LIMIT 5;" },
  { label:"Duplicates",      q:"SELECT customer_id, COUNT(*) FROM customers_raw GROUP BY customer_id HAVING COUNT(*) > 1 ORDER BY 2 DESC LIMIT 10;" },
  { label:"Distinct states", q:"SELECT DISTINCT state FROM customers_raw ORDER BY state;" },
];
function PlaygroundView({ progress, setProgress }) {
  const [query,   setQuery]   = useState("SELECT * FROM customers_raw LIMIT 5;");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [history, setHistory] = useState([]);

  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are a PostgreSQL query simulator. Simulate running SQL against a table 'customers_raw' with columns: customer_id, first_name, last_name, email, phone, city, state, address, zip_code, birth_date, registration_date, last_purchase_date, income, age, customer_segment, is_active, notes. The data is intentionally dirty. Return ONLY valid JSON: {"success":true,"columns":["col1","col2"],"rows":[["v1","v2"]],"rowCount":1,"message":"optional note","tip":"optional SQL tip"} OR {"success":false,"error":"error message"}. Limit to 10 rows. For DML simulate the operation.`,
          messages:[{ role:"user", content:query }]
        })
      });
      const d = await res.json();
      const text = d.content.map(c=>c.text||"").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult(parsed);
      setHistory(h=>[{ q:query.split("\n").find(l=>!l.startsWith("--")&&l.trim())||query.slice(0,60), t:new Date().toLocaleTimeString() }, ...h.slice(0,9)]);
      if (parsed.success) setProgress(p=>({...p,xp:p.xp+5}));
    } catch(e) { setError("API error: "+e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:"0 0 4px", color:T.text, fontSize:22, fontWeight:800 }}>⚡ SQL Playground</h2>
          <p style={{ margin:0, color:T.dim, fontSize:13 }}>AI-powered · PostgreSQL · customers_raw dataset</p>
        </div>
        <Pill label="PostgreSQL" color={T.purple} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
        {PRESETS.map(p=>(
          <button key={p.label} onClick={()=>setQuery(p.q)}
            style={{ padding:"6px 14px", background:T.card, color:T.dim2, border:`1px solid ${T.border}`,
              borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600 }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:20, alignItems:"start" }}>
        <div>
          <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${T.border2}`, marginBottom:14 }}>
            <div style={{ background:"#0a0f1e", padding:"10px 16px", display:"flex",
              justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T.border2}` }}>
              <div style={{ display:"flex", gap:6 }}>
                {["#ef4444","#f59e0b",T.green].map((c,i)=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}
                <span style={{ color:T.dim, fontSize:11, fontFamily:"monospace", marginLeft:8 }}>query.sql</span>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={()=>setQuery("")} outline color={T.dim} small>Clear</Btn>
                <Btn onClick={runQuery} disabled={loading} color={loading?T.muted:T.accent} small>
                  {loading?"Running...":"▶  Run (Ctrl+Enter)"}
                </Btn>
              </div>
            </div>
            <textarea value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>{ if(e.ctrlKey&&e.key==="Enter"){ e.preventDefault(); runQuery(); } }}
              style={{ width:"100%", minHeight:200, background:"#05080f", color:"#7dd3fc",
                fontFamily:"'Fira Code','Courier New',monospace", fontSize:13, lineHeight:1.75,
                border:"none", padding:"18px 20px", boxSizing:"border-box", outline:"none", resize:"vertical" }} />
          </div>
          {error&&<div style={{ padding:"12px 18px", background:T.red+"18", border:`1px solid ${T.red}40`,
            borderRadius:10, color:T.red, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}
          {loading&&<div style={{ textAlign:"center", padding:"40px 0", color:T.dim }}>
            <div style={{ fontSize:30, marginBottom:10 }}>⚡</div><div>Executing via AI...</div>
          </div>}
          {result&&(
            <Card style={{ overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ color:result.success?T.green:T.red, fontWeight:700, fontSize:14 }}>
                  {result.success?`✓ ${result.rowCount??result.rows?.length??0} row(s)`:"✗ Error"}
                </span>
                {result.message&&<span style={{ color:T.dim, fontSize:12 }}>{result.message}</span>}
              </div>
              {result.columns&&result.rows&&(
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr>{result.columns.map(c=>(
                      <th key={c} style={{ padding:"10px 16px", background:"#0a0f1e", color:T.accent,
                        textAlign:"left", borderBottom:`1px solid ${T.border}`, fontFamily:"monospace", fontSize:12 }}>{c}</th>
                    ))}</tr></thead>
                    <tbody>{result.rows.map((row,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${T.border}30` }}>
                        {row.map((cell,j)=>(
                          <td key={j} style={{ padding:"10px 16px", fontFamily:"monospace",
                            color:cell===null||cell==="NULL"||cell===""?T.red+"cc":T.text }}>
                            {cell===null||cell==="NULL"?<em style={{color:T.red}}>NULL</em>:cell===""?<em style={{color:T.muted}}>""</em>:String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {result.tip&&<div style={{ padding:"12px 20px", borderTop:`1px solid ${T.border}`,
                background:T.accent+"0a", color:T.dim2, fontSize:12 }}>💡 <em>{result.tip}</em></div>}
            </Card>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ padding:18 }}>
            <div style={{ color:T.text, fontWeight:700, marginBottom:14, fontSize:13 }}>⌨️ Shortcuts</div>
            <div style={{ fontSize:12, color:T.dim2, lineHeight:2.2 }}>
              <kbd style={{ background:T.muted, padding:"2px 7px", borderRadius:5, color:T.text }}>Ctrl+Enter</kbd> Run
            </div>
          </Card>
          <Card style={{ padding:18 }}>
            <div style={{ color:T.text, fontWeight:700, marginBottom:14, fontSize:13 }}>📋 History</div>
            {history.length===0&&<div style={{ color:T.dim, fontSize:12 }}>No queries yet.</div>}
            {history.map((h,i)=>(
              <div key={i} style={{ fontSize:12, marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${T.border}30` }}>
                <div style={{ color:T.dim2, fontFamily:"monospace", fontSize:11, marginBottom:2, wordBreak:"break-all" }}>{h.q}</div>
                <div style={{ color:T.dim, fontSize:10 }}>{h.t}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── INTERVIEW VIEW ───────────────────────────────────────────────────────────
function InterviewView({ interviewQs }) {
  const [open,     setOpen]     = useState(null);
  const [catF,     setCatF]     = useState("All");
  const [diffF,    setDiffF]    = useState("All");
  const [search,   setSearch]   = useState("");
  const [userCode, setUserCode] = useState({});
  const [aiCheck,  setAiCheck]  = useState({});
  const [aiSol,    setAiSol]    = useState({});
  const [showSol,  setShowSol]  = useState({});
  const [checking, setChecking] = useState(null);
  const [loading,  setLoading]  = useState(null);

  const filtered = interviewQs.filter(q=>{
    const ms=!search||q.q.toLowerCase().includes(search.toLowerCase())||q.company.toLowerCase().includes(search.toLowerCase());
    const mc=catF==="All"||q.cat===catF;
    const md=diffF==="All"||q.d===diffF;
    return ms&&mc&&md;
  });

  const checkAnswer = (id, iq) => {
    if (!userCode[id]?.trim()) return;
    setChecking(id);
    setTimeout(()=>{
      const r = evalSQL(userCode[id]||"", iq.sol||`SELECT -- ${iq.q}`, iq.q);
      setAiCheck(p=>({...p,[id]:r})); setChecking(null);
    }, 600);
  };

  const getSolution = async (id, iq) => {
    setLoading(id);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800,
          messages:[{role:"user",content:`Write a clean PostgreSQL solution for this SQL interview question: "${iq.q}". Return only the SQL code with brief inline comments.`}]
        })
      });
      const d = await res.json();
      setAiSol(p=>({...p,[id]:d.content[0]?.text||"No solution available"}));
      setShowSol(p=>({...p,[id]:true}));
    } catch(e){ setAiSol(p=>({...p,[id]:"Error: "+e.message})); }
    setLoading(null);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:22, fontWeight:800 }}>🎯 SQL Interview Questions</h2>
          <p style={{ margin:0, color:T.dim, fontSize:14 }}>{filtered.length} questions from top tech companies</p>
        </div>
      </div>
      <Card style={{ padding:20, marginBottom:24 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by question or company..."
          style={{ width:"100%", background:"#0a0f1e", border:`1px solid ${T.border2}`, borderRadius:8,
            padding:"10px 16px", color:T.text, fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>CATEGORY</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {INTERVIEW_CATS.map(c=>(
                <button key={c} onClick={()=>setCatF(c)} style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                  fontSize:11, fontWeight:600, background:catF===c?T.purple:"transparent",
                  color:catF===c?"#000":T.dim, border:`1px solid ${catF===c?T.purple:T.border2}` }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>DIFFICULTY</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {INTERVIEW_DIFFS.map(d=>(
                <button key={d} onClick={()=>setDiffF(d)} style={{ padding:"5px 12px", borderRadius:20, cursor:"pointer",
                  fontSize:11, fontWeight:600, background:diffF===d?(DIFF_COLOR[d]||T.accent):"transparent",
                  color:diffF===d?"#000":T.dim, border:`1px solid ${diffF===d?(DIFF_COLOR[d]||T.accent):T.border2}` }}>{d}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ color:T.dim, fontSize:13, marginBottom:16 }}>
        Showing <strong style={{color:T.text}}>{filtered.length}</strong> of {interviewQs.length} questions
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {filtered.map(iq=>{
          const id=iq.id, isOpen=open===id, coColor=CO_COLOR[iq.company]||T.accent, feedback=aiCheck[id];
          return (
            <Card key={id} style={{ overflow:"hidden" }}>
              <div onClick={()=>setOpen(isOpen?null:id)}
                style={{ display:"flex", alignItems:"center", gap:16, padding:"20px 24px", cursor:"pointer" }}>
                <div style={{ width:48, height:48, borderRadius:10, background:coColor+"20",
                  border:`1px solid ${coColor}40`, display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:900, color:coColor, flexShrink:0 }}>
                  {iq.company.slice(0,3).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:T.text, fontWeight:600, fontSize:15, marginBottom:8, lineHeight:1.4 }}>{iq.q}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Pill label={iq.company} color={coColor} />
                    <Pill label={iq.cat} color={T.purple} />
                    <Pill label={iq.d} color={DIFF_COLOR[iq.d]} />
                  </div>
                </div>
                <span style={{ color:T.dim, fontSize:22, transition:"transform .2s",
                  transform:isOpen?"rotate(180deg)":"none", flexShrink:0 }}>⌄</span>
              </div>
              {isOpen&&(
                <div style={{ padding:"0 24px 28px", borderTop:`1px solid ${T.border}` }}>
                  <div style={{ paddingTop:20 }}>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <span style={{ color:T.text, fontWeight:700, fontSize:14 }}>✍️ Write Your SQL Solution</span>
                        <span style={{ color:T.dim, fontSize:12 }}>PostgreSQL</span>
                      </div>
                      <SqlEditor value={userCode[id]||""} onChange={v=>setUserCode(p=>({...p,[id]:v}))} minH={160} />
                    </div>
                    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                      <Btn onClick={()=>checkAnswer(id,iq)} disabled={checking===id||!(userCode[id]||"").trim()} color={T.purple}>
                        {checking===id?"⏳ Checking...":"✅ Check My Answer"}
                      </Btn>
                      <Btn onClick={()=>getSolution(id,iq)} disabled={loading===id} color={T.accent} outline>
                        {loading===id?"⏳ Loading...":"💡 Get AI Solution"}
                      </Btn>
                      <Btn onClick={()=>setShowSol(p=>({...p,[id]:!p[id]}))} outline color={T.dim2} small>
                        {showSol[id]?"Hide":"Show"} Solution
                      </Btn>
                      {(userCode[id]||"").trim()&&<Btn onClick={()=>setUserCode(p=>({...p,[id]:""}))} outline color={T.dim} small>Clear</Btn>}
                    </div>
                    {feedback&&(
                      <div style={{ borderRadius:12, marginBottom:18,
                        background:(feedback.correct||feedback.score>=70?T.green:T.red)+"0d",
                        border:`1px solid ${feedback.correct||feedback.score>=70?T.green:T.red}40`, padding:"16px 20px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
                          <div style={{ fontSize:26 }}>{feedback.correct||feedback.score>=70?"✅":"❌"}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ color:T.text, fontWeight:700 }}>{feedback.correct||feedback.score>=70?"Great answer!":"Keep improving"}</div>
                            <div style={{ color:T.dim, fontSize:12 }}>Score: {feedback.score}/100</div>
                          </div>
                          <div style={{ width:80 }}>
                            <div style={{ height:8, borderRadius:99, background:T.muted }}>
                              <div style={{ height:"100%", borderRadius:99, background:feedback.score>=70?T.green:feedback.score>=40?T.orange:T.red, width:`${feedback.score}%`, transition:"width .6s" }} />
                            </div>
                          </div>
                        </div>
                        <p style={{ color:T.dim2, margin:"0 0 6px", fontSize:13, lineHeight:1.6 }}>{feedback.feedback}</p>
                        {feedback.hint&&<p style={{ color:T.orange, margin:0, fontSize:12 }}>💡 <em>{feedback.hint}</em></p>}
                      </div>
                    )}
                    {(showSol[id]||aiSol[id])&&aiSol[id]&&(
                      <div>
                        <div style={{ color:T.green, fontWeight:700, marginBottom:10, fontSize:14 }}>💡 AI Solution</div>
                        <CodeBlock code={aiSol[id]} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length===0&&<div style={{ textAlign:"center", padding:"60px 0", color:T.dim }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>No questions match your filters.
        </div>}
      </div>
    </div>
  );
}

// ─── PROGRESS VIEW ────────────────────────────────────────────────────────────
function ProgressView({ progress, questions, joinQuestions }) {
  const totalSolved = progress.solvedQ.size + (progress.solvedJ||new Set()).size;
  const totalQ = questions.length + joinQuestions.length;
  const level = Math.floor(progress.xp / 500) + 1;
  const xpInLevel = progress.xp % 500;

  const BADGES = [
    { name:"First Blood",   desc:"Solved first question",   icon:"🎖️", earned:totalSolved>=1 },
    { name:"Getting Warm",  desc:"Solved 10 questions",     icon:"🌡️", earned:totalSolved>=10 },
    { name:"SQL Cleaner",   desc:"Solved 25 questions",     icon:"🧹", earned:totalSolved>=25 },
    { name:"Half Century",  desc:"Solved 50 questions",     icon:"💯", earned:totalSolved>=50 },
    { name:"Join Master",   desc:"Solved all 50 JOIN Qs",   icon:"🔗", earned:(progress.solvedJ||new Set()).size>=50 },
    { name:"SQL Legend",    desc:"Solved 100+ questions",   icon:"👑", earned:totalSolved>=100 },
    { name:"XP Grinder",    desc:"Earned 500 XP",           icon:"⭐", earned:progress.xp>=500 },
    { name:"SQL Pro",       desc:"Earned 1000 XP",          icon:"🏆", earned:progress.xp>=1000 },
    { name:"3-Day Streak",  desc:"3 days in a row",         icon:"🔥", earned:progress.streak>=3 },
    { name:"Bookworm",      desc:"Finished 5 lessons",      icon:"📚", earned:progress.doneLessons.size>=5 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div>
        <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:22, fontWeight:800 }}>📊 My Progress</h2>
        <p style={{ margin:0, color:T.dim, fontSize:14 }}>Track your SQL mastery journey</p>
      </div>

      <Card style={{ padding:"28px 32px", background:"linear-gradient(135deg,#0c1629,#0d1035)", border:`1px solid ${T.accent}30` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div>
            <div style={{ color:T.dim, fontSize:12, fontWeight:700, letterSpacing:2, marginBottom:8 }}>YOUR LEVEL</div>
            <div style={{ fontSize:60, fontWeight:900, color:T.accent, lineHeight:1 }}>{level}</div>
            <div style={{ color:T.dim2, marginTop:6 }}>{500-xpInLevel} XP to Level {level+1}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:44, fontWeight:900, color:T.text }}>{progress.xp}</div>
            <div style={{ color:T.dim }}>Total XP Earned</div>
          </div>
        </div>
        <div style={{ marginTop:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12, color:T.dim }}>
            <span>Level {level}</span><span>Level {level+1}</span>
          </div>
          <div style={{ height:10, borderRadius:99, background:T.muted }}>
            <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${T.purple},${T.accent})`,
              width:`${xpInLevel/5}%`, transition:"width .6s ease" }} />
          </div>
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        {[
          { label:"Cleaning Solved",  val:progress.solvedQ.size,               max:questions.length,     color:T.accent, icon:"🧹" },
          { label:"JOINs Solved",     val:(progress.solvedJ||new Set()).size,   max:joinQuestions.length, color:T.teal,   icon:"🔗" },
          { label:"Day Streak",       val:progress.streak,                       max:null,                 color:T.orange, icon:"🔥" },
          { label:"Total XP",         val:progress.xp,                           max:null,                 color:T.purple, icon:"⭐" },
        ].map(s=>(
          <Card key={s.label} style={{ padding:"22px 20px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:32, fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ color:T.dim, fontSize:13, marginTop:8, marginBottom:s.max?12:0 }}>{s.label}</div>
            {s.max&&(
              <>
                <div style={{ height:5, borderRadius:99, background:T.muted }}>
                  <div style={{ height:"100%", borderRadius:99, background:s.color, width:`${s.val/s.max*100}%` }} />
                </div>
                <div style={{ color:T.dim, fontSize:11, marginTop:6 }}>{s.val} / {s.max}</div>
              </>
            )}
          </Card>
        ))}
      </div>

      <div>
        <h3 style={{ color:T.text, marginBottom:16, fontWeight:800 }}>🏅 Badges</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}>
          {BADGES.map(b=>(
            <Card key={b.name} style={{ padding:"20px 16px", textAlign:"center", opacity:b.earned?1:.35,
              border:`1px solid ${b.earned?T.orange+"50":T.border}`, background:b.earned?T.orange+"08":T.card }}>
              <div style={{ fontSize:36, marginBottom:10 }}>{b.icon}</div>
              <div style={{ color:T.text, fontWeight:700, fontSize:13, marginBottom:6 }}>{b.name}</div>
              <div style={{ color:T.dim, fontSize:11, lineHeight:1.4 }}>{b.desc}</div>
              {b.earned&&<div style={{ marginTop:10 }}><Pill label="✓ Earned" color={T.green} /></div>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ progress, setView, questions, joinQuestions }) {
  const totalQ = questions.length + joinQuestions.length;
  const totalSolved = progress.solvedQ.size + (progress.solvedJ||new Set()).size;
  const level = Math.floor(progress.xp/500)+1;

  const stats = [
    { icon:"🧹", label:"Data Cleaning",    val:`${progress.solvedQ.size}/${questions.length}`,      color:T.accent,  nav:"cleaning" },
    { icon:"🔗", label:"SQL JOINs",        val:`${(progress.solvedJ||new Set()).size}/${joinQuestions.length}`, color:T.teal, nav:"joins" },
    { icon:"⭐", label:"Total XP",          val:progress.xp,                                          color:T.purple,  nav:"progress" },
    { icon:"🎯", label:"Interview Qs",     val:"Practice",                                            color:T.orange,  nav:"interview" },
  ];

  return (
    <div>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ margin:"0 0 8px", color:T.text, fontSize:28, fontWeight:900 }}>
          Welcome to <span style={{ color:T.accent }}>SQL</span>Master 🚀
        </h1>
        <p style={{ margin:0, color:T.dim, fontSize:16 }}>
          {totalSolved} of {totalQ} questions solved · Level {level} · {progress.xp} XP
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
        {stats.map(s=>(
          <Card key={s.label} style={{ padding:"24px 20px", cursor:"pointer", transition:"all .15s",
            border:`1px solid ${T.border}` }}
            onClick={()=>setView(s.nav)}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=s.color+"60"; e.currentTarget.style.background=s.color+"0a"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.card; }}>
            <div style={{ fontSize:32, marginBottom:14 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:s.color, marginBottom:6 }}>{s.val}</div>
            <div style={{ color:T.dim, fontSize:14 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card style={{ padding:24 }}>
          <h3 style={{ color:T.text, margin:"0 0 16px", fontWeight:700 }}>🚀 Quick Start</h3>
          {[
            { emoji:"📘", title:"SQL Curriculum — 13 Lessons", sub:"Theory + examples + MCQ quizzes", color:T.green, nav:"curriculum" },
            { emoji:"🔗", title:"SQL JOINs — 50 Questions", sub:"NEW! Practice INNER, LEFT, SELF, and complex JOINs", color:T.teal, nav:"joins" },
            { emoji:"🧹", title:"Data Cleaning", sub:"Practice with dirty data", color:T.accent, nav:"cleaning" },
            { emoji:"⚡", title:"Playground", sub:"Run free SQL queries", color:T.purple, nav:"playground" },
            { emoji:"🎯", title:"Interview Prep", sub:"Top company questions", color:T.orange, nav:"interview" },
          ].map(item=>(
            <div key={item.nav} onClick={()=>setView(item.nav)}
              style={{ display:"flex", gap:14, alignItems:"center", padding:"14px 16px", borderRadius:10,
                cursor:"pointer", marginBottom:8, background:`${item.color}08`, border:`1px solid ${item.color}25`,
                transition:"all .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${item.color}15`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=`${item.color}08`; }}>
              <span style={{ fontSize:24 }}>{item.emoji}</span>
              <div>
                <div style={{ color:T.text, fontWeight:600, fontSize:14 }}>{item.title}</div>
                <div style={{ color:T.dim, fontSize:12, marginTop:2 }}>{item.sub}</div>
              </div>
              <span style={{ color:item.color, marginLeft:"auto" }}>→</span>
            </div>
          ))}
        </Card>
        <Card style={{ padding:24 }}>
          <h3 style={{ color:T.text, margin:"0 0 16px", fontWeight:700 }}>📈 Your Progress</h3>
          {[
            { label:"Data Cleaning", val:progress.solvedQ.size, max:questions.length, color:T.accent },
            { label:"SQL JOINs",    val:(progress.solvedJ||new Set()).size, max:joinQuestions.length, color:T.teal },
            { label:"XP Level",     val:progress.xp%500, max:500, color:T.purple, suffix:` XP to Lv${level+1}` },
          ].map(s=>(
            <div key={s.label} style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:T.dim2, fontSize:13 }}>{s.label}</span>
                <span style={{ color:s.color, fontWeight:700, fontSize:13 }}>
                  {s.suffix?`${s.val}${s.suffix}`:`${s.val} / ${s.max}`}
                </span>
              </div>
              <div style={{ height:8, borderRadius:99, background:T.muted }}>
                <div style={{ height:"100%", borderRadius:99, background:s.color,
                  width:`${Math.min(100,s.max?s.val/s.max*100:0)}%`, transition:"width .6s" }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ questions, setQuestions, joinQuestions, setJoinQuestions, interviewQs, setInterviewQs, onLogout, backendAvailable }) {
  const [tab,     setTab]     = useState("cleaning");
  const [editing, setEditing] = useState(null);
  const [cForm,   setCForm]   = useState({ q:"", cat:"Exploration", difficulty:"Beginner", sol:"" });
  const [jForm,   setJForm]   = useState({ q:"", cat:"Basic Joins", difficulty:"Beginner", sol:"" });
  const [iForm,   setIForm]   = useState({ q:"", company:"Amazon", cat:"Window Functions", d:"Medium" });
  const [search,  setSearch]  = useState("");
  const [confirm, setConfirm] = useState(null);
  const [msg,     setMsg]     = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [pwForm,  setPwForm]  = useState({ cur:"", np1:"", np2:"", show:false, err:"" });
  const [saving,  setSaving]  = useState(false);

  const showMsg = (text,color=T.green) => { setMsg({text,color}); setTimeout(()=>setMsg(null),2500); };

  // ── Cleaning CRUD ──
  const saveC = async () => {
    if (!cForm.q.trim()||!cForm.sol.trim()) return;
    setSaving(true);
    try {
      if (backendAvailable) {
        if (!editing||editing.id==="new") {
          const row = await API.addCleaning(cForm);
          setQuestions(p=>[...p,row]);
          showMsg(`✓ Cleaning Q #${row.id} added!`);
        } else {
          const row = await API.editCleaning(editing.id, cForm);
          setQuestions(p=>p.map(q=>q.id===editing.id?row:q));
          showMsg(`✓ Updated!`);
        }
      } else {
        if (!editing||editing.id==="new") {
          const id = Math.max(...questions.map(q=>q.id),0)+1;
          setQuestions(p=>[...p,{id,...cForm}]);
          showMsg(`✓ Q #${id} added (local)`);
        } else {
          setQuestions(p=>p.map(q=>q.id===editing.id?{...q,...cForm}:q));
          showMsg(`✓ Updated (local)`);
        }
      }
    } catch(e) { showMsg("Error: "+e.message, T.red); }
    setSaving(false);
    setEditing(null); setCForm({q:"",cat:"Exploration",difficulty:"Beginner",sol:""}); setTab("cleaning");
  };

  // ── Joins CRUD ──
  const saveJ = async () => {
    if (!jForm.q.trim()||!jForm.sol.trim()) return;
    setSaving(true);
    try {
      if (backendAvailable) {
        if (!editing||editing.id==="new") {
          const row = await API.addJoin(jForm);
          setJoinQuestions(p=>[...p,row]);
          showMsg(`✓ JOIN Q #${row.id} added!`);
        } else {
          const row = await API.editJoin(editing.id, jForm);
          setJoinQuestions(p=>p.map(q=>q.id===editing.id?row:q));
          showMsg(`✓ Updated!`);
        }
      } else {
        if (!editing||editing.id==="new") {
          const id = Math.max(...joinQuestions.map(q=>q.id),0)+1;
          setJoinQuestions(p=>[...p,{id,...jForm}]);
          showMsg(`✓ JOIN Q #${id} added (local)`);
        } else {
          setJoinQuestions(p=>p.map(q=>q.id===editing.id?{...q,...jForm}:q));
          showMsg(`✓ Updated (local)`);
        }
      }
    } catch(e) { showMsg("Error: "+e.message, T.red); }
    setSaving(false);
    setEditing(null); setJForm({q:"",cat:"Basic Joins",difficulty:"Beginner",sol:""}); setTab("joins");
  };

  // ── Interview CRUD ──
  const saveI = async () => {
    if (!iForm.q.trim()) return;
    setSaving(true);
    try {
      if (backendAvailable) {
        if (!editing||editing.id==="new") {
          const row = await API.addInterview(iForm);
          setInterviewQs(p=>[...p,row]);
          showMsg(`✓ Interview Q added!`);
        } else {
          const row = await API.editInterview(editing.id, iForm);
          setInterviewQs(p=>p.map(q=>q.id===editing.id?row:q));
          showMsg(`✓ Updated!`);
        }
      } else {
        if (!editing||editing.id==="new") {
          const id = Math.max(...interviewQs.map(q=>q.id),0)+1;
          setInterviewQs(p=>[...p,{id,...iForm}]);
          showMsg(`✓ Added (local)`);
        } else {
          setInterviewQs(p=>p.map(q=>q.id===editing.id?{...q,...iForm}:q));
          showMsg(`✓ Updated (local)`);
        }
      }
    } catch(e) { showMsg("Error: "+e.message, T.red); }
    setSaving(false);
    setEditing(null); setIForm({q:"",company:"Amazon",cat:"Window Functions",d:"Medium"}); setTab("interview");
  };

  const deleteItem = async () => {
    if (!confirm) return;
    try {
      if (backendAvailable) {
        if (confirm.type==="c") { await API.delCleaning(confirm.id); setQuestions(p=>p.filter(q=>q.id!==confirm.id)); }
        else if (confirm.type==="j") { await API.delJoin(confirm.id); setJoinQuestions(p=>p.filter(q=>q.id!==confirm.id)); }
        else { await API.delInterview(confirm.id); setInterviewQs(p=>p.filter(q=>q.id!==confirm.id)); }
      } else {
        if (confirm.type==="c") setQuestions(p=>p.filter(q=>q.id!==confirm.id));
        else if (confirm.type==="j") setJoinQuestions(p=>p.filter(q=>q.id!==confirm.id));
        else setInterviewQs(p=>p.filter(q=>q.id!==confirm.id));
      }
      showMsg(`Deleted #${confirm.id}`, T.red);
    } catch(e) { showMsg("Error: "+e.message, T.red); }
    setConfirm(null);
  };

  const changePassword = async () => {
    setPwForm(f=>({...f,err:""}));
    if (pwForm.np1.length<6) { setPwForm(f=>({...f,err:"Min 6 characters"})); return; }
    if (pwForm.np1!==pwForm.np2) { setPwForm(f=>({...f,err:"Passwords do not match"})); return; }
    try {
      if (backendAvailable) {
        await API.changePass(pwForm.cur, pwForm.np1);
        showMsg("✓ Password updated on server!");
      } else {
        lsSet("sm_admin_pass", pwForm.np1);
        showMsg("✓ Password updated (local)!");
      }
      setPwForm({cur:"",np1:"",np2:"",show:false,err:""});
    } catch(e) { setPwForm(f=>({...f,err:e.message})); }
  };

  const filtC = questions.filter(q=>!search||q.q.toLowerCase().includes(search.toLowerCase()));
  const filtJ = joinQuestions.filter(q=>!search||q.q.toLowerCase().includes(search.toLowerCase()));
  const filtI = interviewQs.filter(q=>!search||q.q.toLowerCase().includes(search.toLowerCase())||q.company.toLowerCase().includes(search.toLowerCase()));

  const inputSt = { width:"100%", background:"#080d18", border:`1px solid ${T.border2}`, borderRadius:8,
    padding:"10px 14px", color:T.text, fontSize:14, outline:"none", boxSizing:"border-box" };
  const labelSt = { display:"block", color:T.dim2, fontSize:11, fontWeight:700, letterSpacing:1.5, marginBottom:8 };

  const Field = ({label,val,onChange,rows,mono=false,placeholder=""}) => (
    <div style={{ marginBottom:16 }}>
      <label style={labelSt}>{label}</label>
      {rows
        ? <textarea value={val} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
            style={{ ...inputSt, resize:"vertical", fontFamily:mono?"'Fira Code',monospace":"inherit",
              color:mono?"#7dd3fc":T.text, lineHeight:1.6 }} />
        : <input value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputSt} />}
    </div>
  );

  const Sel = ({label,val,onChange,opts}) => (
    <div style={{ marginBottom:16 }}>
      <label style={labelSt}>{label}</label>
      <select value={val} onChange={e=>onChange(e.target.value)}
        style={{ ...inputSt, background:"#080d18" }}>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const TABS = [
    { id:"cleaning",  label:`🧹 Cleaning`, count:questions.length },
    { id:"joins",     label:`🔗 JOINs`,    count:joinQuestions.length },
    { id:"interview", label:`🎯 Interview`, count:interviewQs.length },
    { id:"stats",     label:"📊 Stats" },
    { id:"settings",  label:"🔑 Settings" },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h2 style={{ margin:"0 0 6px", color:T.text, fontSize:22, fontWeight:800 }}>⚙️ Admin Panel</h2>
          <p style={{ margin:0, color:T.dim, fontSize:14 }}>
            Manage all questions · {backendAvailable
              ? <span style={{ color:T.green }}>● Connected to backend DB</span>
              : <span style={{ color:T.orange }}>● Local storage mode (no backend)</span>
            }
          </p>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:T.green+"12",
            border:`1px solid ${T.green}30`, borderRadius:20, padding:"6px 14px" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:T.green }}/>
            <span style={{ color:T.green, fontSize:12, fontWeight:700 }}>Authenticated</span>
          </div>
          <button onClick={()=>setLogoutConfirm(true)}
            style={{ padding:"7px 16px", background:"transparent", border:`1.5px solid ${T.red}50`,
              borderRadius:20, color:T.red, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:28, borderBottom:`1px solid ${T.border}` }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:"10px 20px", border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
              background:"transparent", color:tab===t.id?T.accent:T.dim,
              borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent", marginBottom:-1 }}>
            {t.label}{t.count!==undefined?` (${t.count})`:""}
          </button>
        ))}
      </div>

      {/* Cleaning Questions */}
      {tab==="cleaning" && (
        <div>
          <div style={{ display:"flex", gap:14, marginBottom:20, alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..."
              style={{ flex:1, background:T.card, border:`1px solid ${T.border2}`, borderRadius:8,
                padding:"10px 16px", color:T.text, fontSize:14, outline:"none" }} />
            <Btn onClick={()=>{ setEditing({type:"c",id:"new"}); setCForm({q:"",cat:"Exploration",difficulty:"Beginner",sol:""}); setTab("addC"); }} color={T.green}>+ Add Cleaning Q</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtC.map(q=>(
              <div key={q.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                <span style={{ color:T.dim, fontSize:12, fontWeight:700, minWidth:28 }}>#{q.id}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:T.text, fontSize:13, lineHeight:1.4, marginBottom:6 }}>{q.q}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Pill label={q.cat} color={CAT_COLORS[q.cat]||T.accent} />
                    <Pill label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <Btn onClick={()=>{ setEditing({type:"c",id:q.id}); setCForm({q:q.q,cat:q.cat,difficulty:q.difficulty,sol:q.sol}); setTab("addC"); }} small outline color={T.accent}>✏️ Edit</Btn>
                  <Btn onClick={()=>setConfirm({type:"c",id:q.id})} small outline color={T.red}>🗑️</Btn>
                </div>
              </div>
            ))}
            {filtC.length===0&&<div style={{ color:T.dim, textAlign:"center", padding:"40px 0" }}>No questions found.</div>}
          </div>
        </div>
      )}

      {/* JOIN Questions */}
      {tab==="joins" && (
        <div>
          <div style={{ display:"flex", gap:14, marginBottom:20, alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search JOIN questions..."
              style={{ flex:1, background:T.card, border:`1px solid ${T.border2}`, borderRadius:8,
                padding:"10px 16px", color:T.text, fontSize:14, outline:"none" }} />
            <Btn onClick={()=>{ setEditing({type:"j",id:"new"}); setJForm({q:"",cat:"Basic Joins",difficulty:"Beginner",sol:""}); setTab("addJ"); }} color={T.teal}>+ Add JOIN Q</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtJ.map(q=>(
              <div key={q.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                <span style={{ color:T.dim, fontSize:12, fontWeight:700, minWidth:28 }}>#{q.id}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:T.text, fontSize:13, lineHeight:1.4, marginBottom:6 }}>{q.q}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Pill label={q.cat} color={JOIN_CAT_COLORS[q.cat]||T.teal} />
                    <Pill label={q.difficulty} color={DIFF_COLOR[q.difficulty]} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <Btn onClick={()=>{ setEditing({type:"j",id:q.id}); setJForm({q:q.q,cat:q.cat,difficulty:q.difficulty,sol:q.sol}); setTab("addJ"); }} small outline color={T.accent}>✏️ Edit</Btn>
                  <Btn onClick={()=>setConfirm({type:"j",id:q.id})} small outline color={T.red}>🗑️</Btn>
                </div>
              </div>
            ))}
            {filtJ.length===0&&<div style={{ color:T.dim, textAlign:"center", padding:"40px 0" }}>No questions found.</div>}
          </div>
        </div>
      )}

      {/* Interview Questions */}
      {tab==="interview" && (
        <div>
          <div style={{ display:"flex", gap:14, marginBottom:20, alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..."
              style={{ flex:1, background:T.card, border:`1px solid ${T.border2}`, borderRadius:8,
                padding:"10px 16px", color:T.text, fontSize:14, outline:"none" }} />
            <Btn onClick={()=>{ setEditing({type:"i",id:"new"}); setIForm({q:"",company:"Amazon",cat:"Window Functions",d:"Medium"}); setTab("addI"); }} color={T.purple}>+ Add Interview Q</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtI.map(q=>{
              const co=CO_COLOR[q.company]||T.accent;
              return (
                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                  background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:co+"20",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:900, color:co, flexShrink:0 }}>
                    {q.company.slice(0,3).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:T.text, fontSize:13, lineHeight:1.4, marginBottom:6 }}>{q.q}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Pill label={q.company} color={co} /><Pill label={q.cat} color={T.purple} /><Pill label={q.d} color={DIFF_COLOR[q.d]} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <Btn onClick={()=>{ setEditing({type:"i",id:q.id}); setIForm({q:q.q,company:q.company,cat:q.cat,d:q.d}); setTab("addI"); }} small outline color={T.accent}>✏️ Edit</Btn>
                    <Btn onClick={()=>setConfirm({type:"i",id:q.id})} small outline color={T.red}>🗑️</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Cleaning */}
      {tab==="addC" && (
        <Card style={{ padding:28, maxWidth:760 }}>
          <h3 style={{ margin:"0 0 24px", color:T.text, fontWeight:800 }}>
            {editing?.id==="new"?"➕ Add Cleaning Question":`✏️ Edit Cleaning Q #${editing?.id}`}
          </h3>
          <Field label="QUESTION TEXT" val={cForm.q} onChange={v=>setCForm(f=>({...f,q:v}))} rows={3} placeholder="e.g. Count duplicate customer_id values." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Sel label="CATEGORY"   val={cForm.cat}        onChange={v=>setCForm(f=>({...f,cat:v}))}        opts={Object.keys(CAT_COLORS)} />
            <Sel label="DIFFICULTY" val={cForm.difficulty} onChange={v=>setCForm(f=>({...f,difficulty:v}))} opts={["Beginner","Intermediate","Advanced","Expert"]} />
          </div>
          <Field label="SQL SOLUTION" val={cForm.sol} onChange={v=>setCForm(f=>({...f,sol:v}))} rows={10} mono placeholder="-- Write the expected SQL solution here..." />
          <div style={{ display:"flex", gap:12 }}>
            <Btn onClick={saveC} color={T.green} disabled={saving}>{saving?"Saving...":editing?.id==="new"?"✓ Add Question":"✓ Save Changes"}</Btn>
            <Btn onClick={()=>{ setEditing(null); setCForm({q:"",cat:"Exploration",difficulty:"Beginner",sol:""}); setTab("cleaning"); }} outline color={T.dim}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Add/Edit JOIN */}
      {tab==="addJ" && (
        <Card style={{ padding:28, maxWidth:760 }}>
          <h3 style={{ margin:"0 0 24px", color:T.text, fontWeight:800 }}>
            {editing?.id==="new"?"➕ Add JOIN Question":`✏️ Edit JOIN Q #${editing?.id}`}
          </h3>
          <Field label="QUESTION TEXT" val={jForm.q} onChange={v=>setJForm(f=>({...f,q:v}))} rows={3} placeholder="e.g. Write a query to find employees in the IT department." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Sel label="CATEGORY"   val={jForm.cat}        onChange={v=>setJForm(f=>({...f,cat:v}))}        opts={Object.keys(JOIN_CAT_COLORS)} />
            <Sel label="DIFFICULTY" val={jForm.difficulty} onChange={v=>setJForm(f=>({...f,difficulty:v}))} opts={["Beginner","Intermediate","Advanced","Expert"]} />
          </div>
          <Field label="SQL SOLUTION" val={jForm.sol} onChange={v=>setJForm(f=>({...f,sol:v}))} rows={10} mono placeholder="-- Write the expected SQL solution here..." />
          <div style={{ display:"flex", gap:12 }}>
            <Btn onClick={saveJ} color={T.teal} disabled={saving}>{saving?"Saving...":editing?.id==="new"?"✓ Add JOIN Question":"✓ Save Changes"}</Btn>
            <Btn onClick={()=>{ setEditing(null); setJForm({q:"",cat:"Basic Joins",difficulty:"Beginner",sol:""}); setTab("joins"); }} outline color={T.dim}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Add/Edit Interview */}
      {tab==="addI" && (
        <Card style={{ padding:28, maxWidth:760 }}>
          <h3 style={{ margin:"0 0 24px", color:T.text, fontWeight:800 }}>
            {editing?.id==="new"?"➕ Add Interview Question":`✏️ Edit Interview Q #${editing?.id}`}
          </h3>
          <Field label="QUESTION TEXT" val={iForm.q} onChange={v=>setIForm(f=>({...f,q:v}))} rows={3} placeholder="e.g. Find the 2nd highest salary per department." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <Sel label="COMPANY"    val={iForm.company} onChange={v=>setIForm(f=>({...f,company:v}))} opts={["Amazon","Google","Meta","Microsoft","Netflix","Uber","Airbnb","Twitter","Stripe","LinkedIn","Apple","Walmart","Oracle","Other"]} />
            <Sel label="CATEGORY"   val={iForm.cat}     onChange={v=>setIForm(f=>({...f,cat:v}))}     opts={INTERVIEW_CATS.filter(c=>c!=="All")} />
            <Sel label="DIFFICULTY" val={iForm.d}       onChange={v=>setIForm(f=>({...f,d:v}))}       opts={["Easy","Medium","Hard","Expert"]} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8 }}>
            <Btn onClick={saveI} color={T.purple} disabled={saving}>{saving?"Saving...":editing?.id==="new"?"✓ Add Question":"✓ Save Changes"}</Btn>
            <Btn onClick={()=>{ setEditing(null); setIForm({q:"",company:"Amazon",cat:"Window Functions",d:"Medium"}); setTab("interview"); }} outline color={T.dim}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Stats */}
      {tab==="stats" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
            {[
              {val:questions.length,    label:"Cleaning Qs",  color:T.accent},
              {val:joinQuestions.length,label:"JOIN Qs",       color:T.teal},
              {val:interviewQs.length,  label:"Interview Qs", color:T.purple},
              {val:Object.keys(CAT_COLORS).length+Object.keys(JOIN_CAT_COLORS).length, label:"Categories", color:T.orange},
            ].map(s=>(
              <Card key={s.label} style={{ padding:24 }}>
                <div style={{ fontSize:38, fontWeight:900, color:s.color }}>{s.val}</div>
                <div style={{ color:T.dim, marginTop:6, fontSize:14 }}>{s.label}</div>
              </Card>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <Card style={{ padding:24 }}>
              <h3 style={{ color:T.text, margin:"0 0 18px", fontWeight:700 }}>JOIN Qs by Category</h3>
              {Object.entries(JOIN_CAT_COLORS).map(([cat,color])=>{
                const cnt=joinQuestions.filter(q=>q.cat===cat).length;
                return (
                  <div key={cat} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:T.dim2, fontSize:13 }}>{cat}</span>
                      <span style={{ color, fontWeight:700, fontSize:13 }}>{cnt}</span>
                    </div>
                    <div style={{ height:6, borderRadius:99, background:T.muted }}>
                      <div style={{ height:"100%", borderRadius:99, background:color,
                        width:`${joinQuestions.length?cnt/joinQuestions.length*100:0}%` }} />
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card style={{ padding:24 }}>
              <h3 style={{ color:T.text, margin:"0 0 18px", fontWeight:700 }}>Cleaning Qs by Category</h3>
              {Object.entries(CAT_COLORS).map(([cat,color])=>{
                const cnt=questions.filter(q=>q.cat===cat).length;
                return cnt > 0 ? (
                  <div key={cat} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:T.dim2, fontSize:13 }}>{cat}</span>
                      <span style={{ color, fontWeight:700, fontSize:13 }}>{cnt}</span>
                    </div>
                    <div style={{ height:6, borderRadius:99, background:T.muted }}>
                      <div style={{ height:"100%", borderRadius:99, background:color,
                        width:`${questions.length?cnt/questions.length*100:0}%` }} />
                    </div>
                  </div>
                ) : null;
              })}
            </Card>
          </div>
        </div>
      )}

      {/* Settings / Password */}
      {tab==="settings" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <Card style={{ padding:28 }}>
            <h3 style={{ color:T.text, margin:"0 0 24px", fontWeight:800 }}>🔑 Change Admin Password</h3>
            {["CURRENT PASSWORD","NEW PASSWORD (min 6 chars)","CONFIRM NEW PASSWORD"].map((lbl,i)=>{
              const keys=["cur","np1","np2"]; const k=keys[i];
              return (
                <div key={k} style={{ marginBottom:16 }}>
                  <label style={labelSt}>{lbl}</label>
                  <input type={pwForm.show?"text":"password"} value={pwForm[k]}
                    onChange={e=>setPwForm(f=>({...f,[k]:e.target.value}))}
                    style={{ ...inputSt, borderColor:k==="np2"&&pwForm.np2&&pwForm.np1!==pwForm.np2?T.red:T.border2 }} />
                </div>
              );
            })}
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
              <label style={{ display:"flex", gap:8, alignItems:"center", cursor:"pointer", color:T.dim2, fontSize:13 }}>
                <input type="checkbox" checked={pwForm.show} onChange={e=>setPwForm(f=>({...f,show:e.target.checked}))} />
                Show passwords
              </label>
            </div>
            {pwForm.err&&<div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:8,
              padding:"10px 14px", color:T.red, fontSize:13, marginBottom:16 }}>⚠ {pwForm.err}</div>}
            <Btn onClick={changePassword} color={T.purple} disabled={!pwForm.cur||!pwForm.np1||!pwForm.np2}>
              🔒 Update Password
            </Btn>
            <div style={{ marginTop:16, padding:"12px 14px", background:T.green+"08",
              border:`1px solid ${T.green}30`, borderRadius:8, fontSize:12, color:T.dim }}>
              {backendAvailable
                ? "✅ Backend connected — password is stored as a bcrypt hash in SQLite."
                : "⚠️ No backend — password stored in localStorage. Connect backend for production use."
              }
            </div>
          </Card>
          <Card style={{ padding:28 }}>
            <h3 style={{ color:T.text, margin:"0 0 20px", fontWeight:800 }}>🛡️ Security Info</h3>
            {[
              "Use at least 8 characters",
              "Mix uppercase, numbers & symbols",
              "Change password regularly",
              "Never share admin credentials",
              "Always sign out after admin sessions",
              "Admin panel is hidden from learners",
            ].map((tip,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:12, padding:"10px 12px",
                background:T.accent+"08", border:`1px solid ${T.accent}15`, borderRadius:8 }}>
                <span>✅</span><span style={{ color:T.dim2, fontSize:13 }}>{tip}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirm&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(4,7,14,.85)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:16,
            padding:"32px 36px", maxWidth:380, textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:14 }}>🗑️</div>
            <h3 style={{ color:T.text, margin:"0 0 10px", fontWeight:800 }}>Delete Question?</h3>
            <p style={{ color:T.dim, marginBottom:28, fontSize:14 }}>This action cannot be undone.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={deleteItem} style={{ padding:"10px 24px", borderRadius:10, fontWeight:700,
                background:T.red, color:"#fff", border:"none", cursor:"pointer" }}>Yes, Delete</button>
              <button onClick={()=>setConfirm(null)} style={{ padding:"10px 24px", borderRadius:10,
                fontWeight:700, background:"transparent", color:T.dim, border:`1.5px solid ${T.border2}`, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {logoutConfirm&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(4,7,14,.85)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border2}`, borderRadius:16,
            padding:"32px 36px", maxWidth:380, textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:14 }}>🚪</div>
            <h3 style={{ color:T.text, margin:"0 0 10px", fontWeight:800 }}>Sign Out?</h3>
            <p style={{ color:T.dim, marginBottom:28, fontSize:14 }}>You'll need the password to re-enter Admin.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={()=>{ setLogoutConfirm(false); clearToken(); onLogout(); }}
                style={{ padding:"10px 24px", borderRadius:10, fontWeight:700, background:T.red, color:"#fff", border:"none", cursor:"pointer" }}>
                Yes, Sign Out
              </button>
              <button onClick={()=>setLogoutConfirm(false)}
                style={{ padding:"10px 24px", borderRadius:10, fontWeight:700, background:"transparent",
                  color:T.dim, border:`1.5px solid ${T.border2}`, cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {msg&&(
        <div style={{ position:"fixed", top:20, right:20, background:T.card,
          border:`1px solid ${msg.color}50`, color:msg.color, padding:"12px 24px",
          borderRadius:10, fontWeight:700, fontSize:14, zIndex:999 }}>{msg.text}</div>
      )}
    </div>
  );
}

// ─── ADMIN LOGIN MODAL ────────────────────────────────────────────────────────
const MAX_ATTEMPTS=3, LOCKOUT_S=30;
function AdminLoginModal({ onSuccess, onClose, backendAvailable }) {
  const [pw,        setPw]        = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [attempts,  setAttempts]  = useState(0);
  const [locked,    setLocked]    = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading,   setLoading]   = useState(false);
  const inputRef = useRef(null);

  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),80); },[]);

  const startLockout = () => {
    setLocked(true); setCountdown(LOCKOUT_S);
    const t = setInterval(()=>setCountdown(c=>{ if(c<=1){ clearInterval(t); setLocked(false); setAttempts(0); setError(""); return 0; } return c-1; }), 1000);
  };

  const submit = async () => {
    if (locked||!pw.trim()) return;
    setLoading(true); setError("");
    try {
      if (backendAvailable) {
        const { token } = await API.login(pw);
        saveToken(token);
        onSuccess();
      } else {
        const localPass = lsGet("sm_admin_pass", "admin@123");
        if (pw === localPass) { onSuccess(); }
        else throw new Error("Incorrect password");
      }
    } catch(e) {
      const next = attempts+1; setAttempts(next); setPw("");
      if (next>=MAX_ATTEMPTS) { setError(`Too many attempts. Locked ${LOCKOUT_S}s.`); startLockout(); }
      else setError(`Incorrect password. ${MAX_ATTEMPTS-next} attempt${MAX_ATTEMPTS-next===1?"":"s"} remaining.`);
      inputRef.current?.focus();
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(4,7,14,0.88)", backdropFilter:"blur(6px)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:420, background:T.surface, border:`1px solid ${T.border2}`,
        borderRadius:20, overflow:"hidden", boxShadow:`0 32px 80px rgba(0,0,0,.6)` }}>
        <div style={{ background:"linear-gradient(135deg,#1a0a2e,#0c1629)", borderBottom:`1px solid ${T.border}`,
          padding:"32px 32px 28px", textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${T.pink}30,${T.purple}30)`,
            border:`1px solid ${T.pink}40`, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, margin:"0 auto 16px" }}>🔐</div>
          <div style={{ fontSize:20, fontWeight:800, color:T.text, marginBottom:6 }}>Admin Access</div>
          <div style={{ fontSize:13, color:T.dim }}>Enter your admin password to continue</div>
        </div>
        <div style={{ padding:"28px 32px 32px" }}>
          {locked&&(
            <div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:10,
              padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>🔒</span>
              <div>
                <div style={{ color:T.red, fontWeight:700, fontSize:13 }}>Temporarily Locked</div>
                <div style={{ color:T.dim2, fontSize:12, marginTop:2 }}>Try again in <strong style={{color:T.orange}}>{countdown}s</strong></div>
              </div>
            </div>
          )}
          {!locked&&attempts>0&&(
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
              {Array.from({length:MAX_ATTEMPTS}).map((_,i)=>(
                <div key={i} style={{ width:10, height:10, borderRadius:"50%",
                  background:i<attempts?T.red:T.muted, transition:"background .3s" }} />
              ))}
            </div>
          )}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", color:T.dim2, fontSize:11, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>PASSWORD</label>
            <div style={{ position:"relative" }}>
              <input ref={inputRef} type={showPw?"text":"password"} value={pw}
                onChange={e=>{ setPw(e.target.value); setError(""); }}
                onKeyDown={e=>e.key==="Enter"&&submit()} disabled={locked}
                placeholder="Enter admin password"
                style={{ width:"100%", background:locked?T.muted+"20":"#080d18",
                  border:`1.5px solid ${error?T.red:pw.length>0?T.purple:T.border2}`,
                  borderRadius:10, padding:"13px 48px 13px 16px", color:T.text,
                  fontSize:15, outline:"none", boxSizing:"border-box", letterSpacing:showPw?0:3,
                  fontFamily:showPw?"inherit":"monospace" }} />
              <button onClick={()=>setShowPw(v=>!v)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", color:T.dim, fontSize:18 }}>
                {showPw?"🙈":"👁️"}
              </button>
            </div>
            {error&&!locked&&<div style={{ color:T.red, fontSize:12, marginTop:8 }}>⚠ {error}</div>}
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={submit} disabled={locked||!pw.trim()||loading}
              style={{ flex:1, padding:"12px", borderRadius:10, fontWeight:800, fontSize:14,
                cursor:locked||!pw.trim()||loading?"not-allowed":"pointer", border:"none",
                background:locked||!pw.trim()||loading?T.muted:`linear-gradient(135deg,${T.purple},${T.pink})`,
                color:locked||!pw.trim()||loading?T.dim:"#fff" }}>
              {loading?"⏳ Checking...":locked?`🔒 Locked (${countdown}s)`:"→  Unlock Admin Panel"}
            </button>
            <button onClick={onClose}
              style={{ padding:"12px 18px", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer",
                border:`1.5px solid ${T.border2}`, background:"transparent", color:T.dim }}>
              Cancel
            </button>
          </div>
          <div style={{ marginTop:20, padding:"12px 16px", background:T.purple+"0d",
            border:`1px solid ${T.purple}30`, borderRadius:8, fontSize:12, color:T.dim }}>
            <strong style={{ color:T.dim2 }}>Default password:</strong>{" "}
            <code style={{ background:T.card, color:T.accent, padding:"2px 8px", borderRadius:5, fontFamily:"monospace", fontSize:13 }}>admin@123</code>
            <div style={{ marginTop:6 }}>Change it from <strong style={{ color:T.accent }}>Admin → Settings</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard",  label:"Dashboard",  icon:"🏠" },
  { id:"curriculum", label:"Learn",      icon:"📘" },
  { id:"cleaning",   label:"Cleaning",   icon:"🧹" },
  { id:"joins",      label:"SQL JOINs",  icon:"🔗" },
  { id:"playground", label:"Playground", icon:"⚡" },
  { id:"interview",  label:"Interview",  icon:"🎯" },
  { id:"progress",   label:"Progress",   icon:"📊" },
  { id:"admin",      label:"Admin",      icon:"⚙️" },
];

export default function App() {
  const [view,          setView]          = useState("dashboard");
  const [questions,     setQuestions]     = useState(()=>lsGet("sm_cleaning", FALLBACK_CLEANING));
  const [joinQuestions, setJoinQuestions] = useState(()=>lsGet("sm_joins", FALLBACK_JOINS));
  const [interviewQs,   setInterviewQs]   = useState(()=>lsGet("sm_interview", FALLBACK_INTERVIEW));
  const [progress,      setProgress]      = useState(progressFromLS);
  const [adminAuthed,   setAdminAuthed]   = useState(false);
  const [showLogin,     setShowLogin]     = useState(false);
  const [backendOk,     setBackendOk]     = useState(false);
  const [dataLoaded,    setDataLoaded]    = useState(false);

  // ── Persist progress to localStorage whenever it changes ──
  useEffect(() => { progressToLS(progress); }, [progress]);

  // ── Persist questions to localStorage ──
  useEffect(() => { lsSet("sm_cleaning",  questions); },     [questions]);
  useEffect(() => { lsSet("sm_joins",     joinQuestions); },  [joinQuestions]);
  useEffect(() => { lsSet("sm_interview", interviewQs); },    [interviewQs]);

  // ── Try to load data from backend on mount ──
  useEffect(() => {
    async function loadFromBackend() {
      try {
        await API.health();
        setBackendOk(true);
        const [c, j, i] = await Promise.all([API.getCleaning(), API.getJoins(), API.getInterview()]);
        if (c.length) setQuestions(c);
        if (j.length) setJoinQuestions(j);
        if (i.length) setInterviewQs(i);
      } catch {
        // Backend unavailable — use localStorage data (already in state)
      }
      setDataLoaded(true);
    }
    loadFromBackend();
  }, []);

  // ── Persist progress to localStorage on change ──
  const handleSetProgress = useCallback((updater) => {
    setProgress(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      progressToLS(next);
      return next;
    });
  }, []);

  const navigate = (id) => {
    if (id==="admin"&&!adminAuthed) { setShowLogin(true); }
    else { setView(id); }
  };
  const handleAdminSuccess = () => { setAdminAuthed(true); setShowLogin(false); setView("admin"); };
  const handleAdminLogout  = () => { setAdminAuthed(false); setView("dashboard"); };

  if (!dataLoaded) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh",
      background:T.bg, color:T.text, flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:40 }}>⚡</div>
      <div style={{ fontSize:16, color:T.dim }}>Loading SQL Master...</div>
    </div>
  );

  const VIEWS = {
    dashboard:  <Dashboard      progress={progress} setView={navigate} questions={questions} joinQuestions={joinQuestions} />,
    curriculum: <CurriculumView progress={progress} setProgress={handleSetProgress} />,
    cleaning:   <CleaningView   progress={progress} setProgress={handleSetProgress} questions={questions} />,
    joins:      <JoinsView      progress={progress} setProgress={handleSetProgress} joinQuestions={joinQuestions} />,
    playground: <PlaygroundView progress={progress} setProgress={handleSetProgress} />,
    interview:  <InterviewView  interviewQs={interviewQs} />,
    progress:   <ProgressView   progress={progress} questions={questions} joinQuestions={joinQuestions} />,
    admin:      <AdminPanel     questions={questions} setQuestions={setQuestions}
                                joinQuestions={joinQuestions} setJoinQuestions={setJoinQuestions}
                                interviewQs={interviewQs} setInterviewQs={setInterviewQs}
                                onLogout={handleAdminLogout} backendAvailable={backendOk} />,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg,
      color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {showLogin&&<AdminLoginModal onSuccess={handleAdminSuccess} onClose={()=>setShowLogin(false)} backendAvailable={backendOk} />}

      {/* Sidebar */}
      <div style={{ width:220, background:T.sidebar, borderRight:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ padding:"28px 22px 22px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:-.5, fontFamily:"Georgia,serif" }}>
            <span style={{ color:T.accent }}>SQL</span><span style={{ color:T.text }}>Master</span>
          </div>
          <div style={{ fontSize:11, color:T.dim, marginTop:3, letterSpacing:1 }}>LEARN · PRACTICE · MASTER</div>
        </div>
        <nav style={{ padding:"14px 10px", flex:1 }}>
          {NAV_ITEMS.map(n=>{
            const active=view===n.id, isAdmin=n.id==="admin", isJoins=n.id==="joins";
            return (
              <div key={n.id} onClick={()=>navigate(n.id)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
                  borderRadius:10, cursor:"pointer", marginBottom:2,
                  background:active?T.accent+"18":"transparent",
                  color:active?T.accent:isAdmin&&!adminAuthed?T.pink:T.dim,
                  fontWeight:active?700:500, fontSize:14, transition:"all .15s" }}>
                <span style={{ fontSize:17 }}>{n.icon}</span>
                <span>{n.label}</span>
                {isJoins&&(
                  <span style={{ marginLeft:"auto", background:T.teal+"25", color:T.teal,
                    fontSize:9, padding:"2px 6px", borderRadius:99, fontWeight:800 }}>NEW</span>
                )}
                {isAdmin&&(
                  <span style={{ marginLeft:"auto",
                    background:adminAuthed?T.green+"25":T.pink+"25",
                    color:adminAuthed?T.green:T.pink,
                    fontSize:9, padding:"2px 6px", borderRadius:99, fontWeight:800 }}>
                    {adminAuthed?"ON":"🔒"}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
        <div style={{ padding:"16px 18px", borderTop:`1px solid ${T.border}`, margin:"0 8px 12px" }}>
          <div style={{ background:"linear-gradient(135deg,#1e1040,#0c1a35)",
            border:`1px solid ${T.accent}25`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:900, color:T.accent }}>{progress.xp} XP</div>
            <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>Level {Math.floor(progress.xp/500)+1}</div>
            <div style={{ marginTop:8, height:5, borderRadius:99, background:T.muted }}>
              <div style={{ height:"100%", borderRadius:99,
                background:`linear-gradient(90deg,${T.purple},${T.accent})`,
                width:`${(progress.xp%500)/5}%`, transition:"width .4s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", padding:"36px 32px" }}>
          {VIEWS[view]}
        </div>
      </div>
    </div>
  );
}
