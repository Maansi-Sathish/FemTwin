const BASE = "http://localhost:8000";
const getToken = () => localStorage.getItem("femtwin_token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export async function register(data) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  localStorage.setItem("femtwin_token", data.access_token);
  return data;
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateMe(data) {
  const res = await fetch(`${BASE}/auth/me`, {
    method: "PATCH", headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function analyzeHealth(symptoms) {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(symptoms),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${BASE}/history`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function uploadReport(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload-report`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getReports() {
  const res = await fetch(`${BASE}/reports`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export function logout() {
  localStorage.removeItem("femtwin_token");
}