// Auth.jsx — Signup, Login, OTP Verification, Forgot Password
import { useState, useRef, useEffect } from "react";
import { API, saveUserToken, saveUser } from "./api.js";

const T = {
  bg:"#080c14", surface:"#111827", card:"#151f30", border:"#1e2d45", border2:"#243350",
  accent:"#38bdf8", purple:"#8b5cf6", green:"#22c55e", orange:"#f59e0b",
  red:"#ef4444", pink:"#ec4899", muted:"#334155", text:"#e2e8f0", dim:"#64748b", dim2:"#94a3b8",
};

function Input({ label, type="text", value, onChange, placeholder, error, icon, onKeyDown, autoFocus }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display:"block", color:T.dim2, fontSize:11, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:T.dim }}>{icon}</span>}
        <input
          autoFocus={autoFocus}
          type={isPass ? (show?"text":"password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            width:"100%", background:"#080d18", border:`1.5px solid ${error?T.red:value?T.border2:T.border}`,
            borderRadius:10, padding:`12px ${isPass?44:14}px 12px ${icon?42:14}px`,
            color:T.text, fontSize:15, outline:"none", boxSizing:"border-box",
            transition:"border-color .2s"
          }}
        />
        {isPass && (
          <button onClick={()=>setShow(v=>!v)} type="button"
            style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", color:T.dim, fontSize:16, padding:0 }}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <div style={{ color:T.red, fontSize:12, marginTop:6 }}>⚠ {error}</div>}
    </div>
  );
}

function Btn({ children, onClick, color=T.accent, loading=false, disabled=false, outline=false }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%", padding:"13px", borderRadius:10, fontWeight:800, fontSize:15, cursor:disabled||loading?"not-allowed":"pointer",
      border: outline ? `1.5px solid ${color}60` : "none",
      background: outline ? "transparent" : (disabled||loading ? T.muted : color),
      color: outline ? color : (disabled||loading ? T.dim : "#000"),
      transition:"all .2s", marginBottom:10,
    }}>
      {loading ? "⏳ Please wait..." : children}
    </button>
  );
}

// ─── SIGNUP SCREEN ─────────────────────────────────────────────────────────
function SignupScreen({ onSuccess, onSwitchToLogin }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim())             return setError("Name is required");
    if (!email.trim())            return setError("Email is required");
    if (password.length < 6)      return setError("Password must be at least 6 characters");
    if (password !== confirm)     return setError("Passwords do not match");
    setLoading(true);
    try {
      await API.userSignup(name.trim(), email.trim(), password);
      onSuccess(email.trim(), name.trim());
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const strength = password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? "Strong"
    : password.length >= 6 ? "Medium" : password ? "Weak" : "";
  const strengthColor = strength === "Strong" ? T.green : strength === "Medium" ? T.orange : T.red;

  return (
    <div>
      <h2 style={{ color:T.text, fontSize:24, fontWeight:900, margin:"0 0 6px" }}>Create Account</h2>
      <p style={{ color:T.dim, fontSize:14, margin:"0 0 28px" }}>Join SQL Master and start your journey</p>

      <Input label="YOUR NAME" value={name} onChange={setName} placeholder="e.g. Rahul Kumar" icon="👤" autoFocus
        onKeyDown={e=>e.key==="Enter"&&submit()} />
      <Input label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@email.com" icon="📧"
        onKeyDown={e=>e.key==="Enter"&&submit()} />
      <Input label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters"
        onKeyDown={e=>e.key==="Enter"&&submit()} />
      {password && (
        <div style={{ marginTop:-12, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, color:T.dim }}>STRENGTH</span>
            <span style={{ fontSize:11, fontWeight:700, color:strengthColor }}>{strength}</span>
          </div>
          <div style={{ height:4, borderRadius:99, background:T.muted }}>
            <div style={{ height:"100%", borderRadius:99, transition:"width .3s",
              width: strength==="Strong"?"100%":strength==="Medium"?"60%":"25%",
              background:strengthColor }} />
          </div>
        </div>
      )}
      <Input label="CONFIRM PASSWORD" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password"
        error={confirm&&password!==confirm?"Passwords do not match":""}
        onKeyDown={e=>e.key==="Enter"&&submit()} />

      {error && <div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:8,
        padding:"10px 14px", color:T.red, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

      <Btn onClick={submit} loading={loading} color={T.accent}>Create Account →</Btn>
      <div style={{ textAlign:"center", color:T.dim, fontSize:14 }}>
        Already have an account?{" "}
        <span onClick={onSwitchToLogin} style={{ color:T.accent, cursor:"pointer", fontWeight:700 }}>Sign In</span>
      </div>
    </div>
  );
}

// ─── OTP SCREEN ────────────────────────────────────────────────────────────
function OtpScreen({ email, name, onSuccess, onBack, mode = "verify" }) {
  const [otp,      setOtp]      = useState(["","","","","",""]);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resending,setResending]= useState(false);
  const [countdown,setCountdown]= useState(60);
  const [newPass,  setNewPass]  = useState("");
  const [step,     setStep]     = useState("otp"); // "otp" | "newpass"
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c-1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { refs[0].current?.focus(); }, []);

  const handleOtpChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...otp]; next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) refs[i+1].current?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i-1].current?.focus();
    if (e.key === "Enter") submit();
  };

  const submit = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Enter the 6-digit code");
    setError(""); setLoading(true);
    try {
      if (mode === "reset" && step === "otp") {
        // Just validate OTP for reset (we'll send with new password)
        setStep("newpass"); setLoading(false); return;
      }
      if (mode === "reset" && step === "newpass") {
        await API.resetPass(email, code, newPass);
        onSuccess("reset");
      } else {
        const data = await API.verifyOtp(email, code);
        saveUserToken(data.token);
        saveUser(data.user);
        onSuccess(data);
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const resend = async () => {
    setResending(true); setError("");
    try {
      if (mode === "reset") await API.forgotPass(email);
      else await API.resendOtp(email);
      setCountdown(60); setOtp(["","","","","",""]);
      refs[0].current?.focus();
    } catch(e) { setError(e.message); }
    setResending(false);
  };

  return (
    <div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.accent, cursor:"pointer",
        fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>← Back</button>

      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{mode==="reset"?"🔑":"📧"}</div>
        <h2 style={{ color:T.text, fontSize:22, fontWeight:900, margin:"0 0 8px" }}>
          {mode==="reset"?"Reset Password":"Verify Your Email"}
        </h2>
        <p style={{ color:T.dim, fontSize:14, margin:0 }}>
          We sent a 6-digit code to<br/>
          <strong style={{ color:T.accent }}>{email}</strong>
        </p>
      </div>

      {step === "otp" && (
        <>
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:24 }}>
            {otp.map((v, i) => (
              <input key={i} ref={refs[i]} value={v}
                onChange={e=>handleOtpChange(i, e.target.value)}
                onKeyDown={e=>handleOtpKey(i, e)}
                maxLength={1} inputMode="numeric"
                style={{ width:48, height:56, textAlign:"center", fontSize:24, fontWeight:900,
                  background:"#080d18", border:`2px solid ${v?T.accent:T.border2}`,
                  borderRadius:10, color:T.text, outline:"none", transition:"border-color .2s" }} />
            ))}
          </div>
          {error && <div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:8,
            padding:"10px 14px", color:T.red, fontSize:13, marginBottom:16, textAlign:"center" }}>⚠ {error}</div>}
          <Btn onClick={submit} loading={loading} color={T.accent}>
            {mode==="reset"?"Verify Code →":"Verify & Continue →"}
          </Btn>
          <div style={{ textAlign:"center", color:T.dim, fontSize:13 }}>
            {countdown > 0
              ? <>Code expires in <strong style={{ color:T.orange }}>{countdown}s</strong></>
              : <span onClick={resend} style={{ color:T.accent, cursor:"pointer", fontWeight:700 }}>
                  {resending?"Sending...":"Resend Code"}
                </span>
            }
          </div>
        </>
      )}

      {step === "newpass" && (
        <>
          <Input label="NEW PASSWORD" type="password" value={newPass} onChange={setNewPass}
            placeholder="Min 6 characters" autoFocus onKeyDown={e=>e.key==="Enter"&&submit()} />
          {error && <div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:8,
            padding:"10px 14px", color:T.red, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}
          <Btn onClick={submit} loading={loading} color={T.green}>Set New Password ✓</Btn>
        </>
      )}
    </div>
  );
}

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
function LoginScreen({ onSuccess, onSwitchToSignup, onForgotPassword }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) return setError("Email and password required");
    setLoading(true);
    try {
      const data = await API.userLogin(email.trim(), password);
      saveUserToken(data.token);
      saveUser(data.user);
      onSuccess(data);
    } catch(e) {
      if (e.message && e.message.includes("not verified")) {
        setError("Email not verified. Please check your inbox for the OTP.");
      } else {
        setError(e.message);
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ color:T.text, fontSize:24, fontWeight:900, margin:"0 0 6px" }}>Welcome Back! 👋</h2>
      <p style={{ color:T.dim, fontSize:14, margin:"0 0 28px" }}>Sign in to continue your SQL journey</p>

      <Input label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail}
        placeholder="you@email.com" icon="📧" autoFocus onKeyDown={e=>e.key==="Enter"&&submit()} />
      <Input label="PASSWORD" type="password" value={password} onChange={setPassword}
        placeholder="Your password" onKeyDown={e=>e.key==="Enter"&&submit()} />

      <div style={{ textAlign:"right", marginTop:-10, marginBottom:20 }}>
        <span onClick={onForgotPassword} style={{ color:T.accent, cursor:"pointer", fontSize:13, fontWeight:600 }}>
          Forgot password?
        </span>
      </div>

      {error && <div style={{ background:T.red+"15", border:`1px solid ${T.red}40`, borderRadius:8,
        padding:"10px 14px", color:T.red, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}

      <Btn onClick={submit} loading={loading} color={T.accent}>Sign In →</Btn>
      <div style={{ textAlign:"center", color:T.dim, fontSize:14 }}>
        Don't have an account?{" "}
        <span onClick={onSwitchToSignup} style={{ color:T.accent, cursor:"pointer", fontWeight:700 }}>Sign Up</span>
      </div>
    </div>
  );
}

// ─── DAILY CHALLENGE POPUP ─────────────────────────────────────────────────
export function DailyChallenge({ question, userName, onClose, onSolve }) {
  const [answer,   setAnswer]   = useState("");
  const [checked,  setChecked]  = useState(false);
  const [score,    setScore]    = useState(null);
  const [showSol,  setShowSol]  = useState(false);

  if (!question) return null;

  const check = () => {
    if (!answer.trim()) return;
    // Simple token-based scoring
    const norm = s => s.toLowerCase().replace(/\s+/g," ").replace(/;+$/,"").trim();
    const u = norm(answer), s = norm(question.sol||"");
    const uToks = new Set(u.match(/\b\w+\b/g)||[]);
    const sToks = new Set(s.match(/\b\w+\b/g)||[]);
    const matches = [...sToks].filter(t=>uToks.has(t)).length;
    const sc = Math.min(100, Math.round((matches/Math.max(sToks.size,1))*120));
    setScore(sc); setChecked(true);
    onSolve(question.id, sc);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:3000, display:"flex",
      alignItems:"center", justifyContent:"center",
      background:"rgba(4,7,14,0.92)", backdropFilter:"blur(8px)" }}>
      <div style={{ width:"min(680px, 94vw)", background:"#0d1220",
        border:`1px solid ${T.accent}40`, borderRadius:20, overflow:"hidden",
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:`0 0 60px ${T.accent}20` }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${T.accent}18,${T.purple}18)`,
          borderBottom:`1px solid ${T.border}`, padding:"24px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ fontSize:24 }}>⚡</span>
                <span style={{ color:T.accent, fontWeight:800, fontSize:18 }}>Daily Challenge</span>
                <span style={{ background:T.orange+"25", color:T.orange, fontSize:11,
                  fontWeight:800, padding:"3px 8px", borderRadius:99 }}>+50 XP BONUS</span>
              </div>
              <div style={{ color:T.dim, fontSize:13 }}>Good to see you, <strong style={{color:T.text}}>{userName}</strong>! Here's today's question.</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none",
              color:T.dim, fontSize:22, cursor:"pointer" }}>✕</button>
          </div>
        </div>

        {/* Question */}
        <div style={{ padding:"24px 28px" }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
            padding:"16px 20px", marginBottom:20 }}>
            <div style={{ color:T.dim, fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:8 }}>TODAY'S QUESTION</div>
            <div style={{ color:T.text, fontSize:16, fontWeight:700, lineHeight:1.5 }}>{question.q}</div>
            <div style={{ marginTop:10, display:"flex", gap:8 }}>
              <span style={{ background:T.accent+"20", color:T.accent, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>{question.cat}</span>
              <span style={{ background:"#22c55e20", color:"#22c55e", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>{question.difficulty}</span>
            </div>
          </div>

          {/* Editor */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:T.dim2, fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:8 }}>YOUR SOLUTION</div>
            <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
              placeholder="-- Write your SQL here..."
              style={{ width:"100%", minHeight:120, background:"#05080f", color:"#7dd3fc",
                fontFamily:"'Fira Code','Courier New',monospace", fontSize:13, lineHeight:1.8,
                border:`1px solid ${T.border2}`, borderRadius:10, padding:"14px 16px",
                boxSizing:"border-box", outline:"none", resize:"vertical" }} />
          </div>

          {/* Result */}
          {checked && score !== null && (
            <div style={{ background:score>=70?T.green+"12":T.orange+"12",
              border:`1px solid ${score>=70?T.green:T.orange}40`,
              borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:28 }}>{score>=90?"🏆":score>=70?"✅":"📚"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:T.text, fontWeight:700 }}>
                    {score>=90?"Perfect!":score>=70?"Good job! +50 XP":"Keep practicing!"}
                  </div>
                  <div style={{ height:6, borderRadius:99, background:T.muted, marginTop:6 }}>
                    <div style={{ height:"100%", borderRadius:99, transition:"width .6s",
                      width:`${score}%`, background:score>=70?T.green:T.orange }} />
                  </div>
                </div>
                <div style={{ color:score>=70?T.green:T.orange, fontSize:22, fontWeight:900 }}>{score}</div>
              </div>
            </div>
          )}

          {showSol && (
            <div style={{ background:"#05080f", border:`1px solid ${T.border2}`, borderRadius:10,
              padding:"16px 20px", marginBottom:16 }}>
              <div style={{ color:T.green, fontWeight:700, marginBottom:8, fontSize:13 }}>✓ Solution</div>
              <pre style={{ margin:0, color:"#7dd3fc", fontSize:12, lineHeight:1.8,
                fontFamily:"'Fira Code',monospace", whiteSpace:"pre-wrap" }}>{question.sol}</pre>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {!checked && (
              <button onClick={check} disabled={!answer.trim()}
                style={{ padding:"10px 24px", background:T.purple, color:"#000",
                  border:"none", borderRadius:10, fontWeight:700, fontSize:14,
                  cursor:answer.trim()?"pointer":"not-allowed", opacity:answer.trim()?1:.5 }}>
                ✅ Check Answer
              </button>
            )}
            <button onClick={()=>setShowSol(v=>!v)}
              style={{ padding:"10px 24px", background:"transparent", color:T.accent,
                border:`1.5px solid ${T.accent}50`, borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {showSol?"Hide":"👁 Show"} Solution
            </button>
            <button onClick={onClose}
              style={{ padding:"10px 24px", background:"transparent", color:T.dim,
                border:`1.5px solid ${T.border2}`, borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {checked?"Continue to App →":"Skip for Today"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN AUTH GATE ─────────────────────────────────────────────────────────
export default function AuthGate({ onAuthenticated }) {
  const [screen, setScreen] = useState("login"); // login | signup | otp | forgot | reset_otp
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName,  setPendingName]  = useState("");
  const [otpMode,      setOtpMode]      = useState("verify"); // verify | reset

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Segoe UI',system-ui,sans-serif", padding:16 }}>

      <div style={{ width:"min(440px, 100%)" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:32, fontWeight:900, fontFamily:"Georgia,serif", marginBottom:4 }}>
            <span style={{ color:T.accent }}>SQL</span><span style={{ color:T.text }}>Master</span>
          </div>
          <div style={{ fontSize:12, color:T.dim, letterSpacing:2 }}>LEARN · PRACTICE · MASTER</div>
        </div>

        {/* Auth card */}
        <div style={{ background:"#0d1220", border:`1px solid ${T.border2}`,
          borderRadius:20, padding:"32px 32px 28px",
          boxShadow:"0 32px 80px rgba(0,0,0,.5)" }}>

          {screen === "login" && (
            <LoginScreen
              onSuccess={data => onAuthenticated(data)}
              onSwitchToSignup={() => setScreen("signup")}
              onForgotPassword={() => { setScreen("forgot"); }}
            />
          )}

          {screen === "signup" && (
            <SignupScreen
              onSuccess={(email, name) => {
                setPendingEmail(email); setPendingName(name);
                setOtpMode("verify"); setScreen("otp");
              }}
              onSwitchToLogin={() => setScreen("login")}
            />
          )}

          {screen === "otp" && (
            <OtpScreen
              email={pendingEmail}
              name={pendingName}
              mode={otpMode}
              onBack={() => setScreen(otpMode==="reset"?"login":"signup")}
              onSuccess={data => {
                if (data === "reset") { setScreen("login"); }
                else { onAuthenticated(data); }
              }}
            />
          )}

          {screen === "forgot" && (
            <div>
              <button onClick={()=>setScreen("login")} style={{ background:"none", border:"none",
                color:T.accent, cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:20, padding:0 }}>
                ← Back to Login
              </button>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔑</div>
                <h2 style={{ color:T.text, fontSize:22, fontWeight:900, margin:"0 0 8px" }}>Forgot Password?</h2>
                <p style={{ color:T.dim, fontSize:14, margin:0 }}>Enter your email and we'll send an OTP</p>
              </div>
              <ForgotForm onSent={email => {
                setPendingEmail(email); setOtpMode("reset"); setScreen("otp");
              }} />
            </div>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:20, color:T.dim, fontSize:12 }}>
          🔒 Your data is secure · Free to use · No spam
        </div>
      </div>
    </div>
  );
}

function ForgotForm({ onSent }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (!email.trim()) return setError("Email required");
    setLoading(true); setError("");
    try { await API.forgotPass(email.trim()); onSent(email.trim()); }
    catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <Input label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail}
        placeholder="your-email@example.com" icon="📧" autoFocus
        error={error} onKeyDown={e=>e.key==="Enter"&&submit()} />
      <Btn onClick={submit} loading={loading} color={T.accent}>Send OTP →</Btn>
    </div>
  );
}
