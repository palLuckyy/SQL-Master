// api.js — All backend API calls
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() { return localStorage.getItem("sm_admin_token") || ""; }

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const API = {
  // Auth
  login:       (password)              => req("POST", "/api/auth/login", { password }),
  changePass:  (currentPassword, newPassword) => req("PUT",  "/api/auth/password", { currentPassword, newPassword }),

  // Cleaning questions
  getCleaning: ()        => req("GET",    "/api/questions/cleaning"),
  addCleaning: (data)    => req("POST",   "/api/questions/cleaning", data),
  editCleaning:(id, data)=> req("PUT",    `/api/questions/cleaning/${id}`, data),
  delCleaning: (id)      => req("DELETE", `/api/questions/cleaning/${id}`),

  // Join questions
  getJoins:    ()        => req("GET",    "/api/questions/joins"),
  addJoin:     (data)    => req("POST",   "/api/questions/joins", data),
  editJoin:    (id, data)=> req("PUT",    `/api/questions/joins/${id}`, data),
  delJoin:     (id)      => req("DELETE", `/api/questions/joins/${id}`),

  // Interview questions
  getInterview:()        => req("GET",    "/api/questions/interview"),
  addInterview:(data)    => req("POST",   "/api/questions/interview", data),
  editInterview:(id,data)=> req("PUT",    `/api/questions/interview/${id}`, data),
  delInterview:(id)      => req("DELETE", `/api/questions/interview/${id}`),

  // Util
  health:      ()        => req("GET",    "/api/health"),
};

export function saveToken(t) { localStorage.setItem("sm_admin_token", t); }
export function clearToken() { localStorage.removeItem("sm_admin_token"); }
