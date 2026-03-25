// api.js — All backend API calls
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getAdminToken() { return localStorage.getItem("sm_admin_token") || ""; }
function getUserToken()  { return localStorage.getItem("sm_user_token")  || ""; }

async function req(method, path, body, useUserToken = false) {
  const headers = { "Content-Type": "application/json" };
  const token = useUserToken ? getUserToken() : getAdminToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const API = {
  // Admin auth
  login:        (password)                   => req("POST", "/api/auth/login",    { password }),
  changePass:   (currentPassword, newPassword) => req("PUT", "/api/auth/password", { currentPassword, newPassword }),

  // User auth
  userSignup:   (name, email, password)      => req("POST", "/api/user/signup",         { name, email, password }),
  verifyOtp:    (email, otp)                 => req("POST", "/api/user/verify-otp",      { email, otp }),
  resendOtp:    (email)                      => req("POST", "/api/user/resend-otp",      { email }),
  userLogin:    (email, password)            => req("POST", "/api/user/login",           { email, password }),
  forgotPass:   (email)                      => req("POST", "/api/user/forgot-password", { email }),
  resetPass:    (email, otp, newPassword)    => req("POST", "/api/user/reset-password",  { email, otp, newPassword }),
  getMe:        ()                           => req("GET",  "/api/user/me",   null, true),
  saveProgress: (data)                       => req("PUT",  "/api/user/progress", data, true),
  dailyDone:    (questionId, score)          => req("POST", "/api/user/daily-done", { questionId, score }, true),
  leaderboard:  ()                           => req("GET",  "/api/leaderboard"),

  // Admin user management
  adminUsers:   ()                           => req("GET",  "/api/admin/users"),
  adminStats:   ()                           => req("GET",  "/api/admin/stats"),

  // Questions
  getCleaning:  ()         => req("GET",    "/api/questions/cleaning"),
  addCleaning:  (data)     => req("POST",   "/api/questions/cleaning",     data),
  editCleaning: (id, data) => req("PUT",    `/api/questions/cleaning/${id}`, data),
  delCleaning:  (id)       => req("DELETE", `/api/questions/cleaning/${id}`),

  getJoins:     ()         => req("GET",    "/api/questions/joins"),
  addJoin:      (data)     => req("POST",   "/api/questions/joins",     data),
  editJoin:     (id, data) => req("PUT",    `/api/questions/joins/${id}`, data),
  delJoin:      (id)       => req("DELETE", `/api/questions/joins/${id}`),

  getInterview: ()         => req("GET",    "/api/questions/interview"),
  addInterview: (data)     => req("POST",   "/api/questions/interview",     data),
  editInterview:(id, data) => req("PUT",    `/api/questions/interview/${id}`, data),
  delInterview: (id)       => req("DELETE", `/api/questions/interview/${id}`),

  health: () => req("GET", "/api/health"),
};

export function saveAdminToken(t) { localStorage.setItem("sm_admin_token", t); }
export function clearAdminToken() { localStorage.removeItem("sm_admin_token"); }
export function saveUserToken(t)  { localStorage.setItem("sm_user_token",  t); }
export function clearUserToken()  { localStorage.removeItem("sm_user_token"); localStorage.removeItem("sm_user"); }
export function getSavedUser()    { try { return JSON.parse(localStorage.getItem("sm_user")||"null"); } catch { return null; } }
export function saveUser(u)       { localStorage.setItem("sm_user", JSON.stringify(u)); }

// Re-export old names for compatibility
export const saveToken = saveAdminToken;
export const clearToken = clearAdminToken;
