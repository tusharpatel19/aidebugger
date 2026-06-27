const API_BASE = "http://localhost:5000/api";

export async function authRequest(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Server error.");
  }
  return data;
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch user.");
  }
  return data;
}

export async function fetchHistory(token) {
  const response = await fetch(`${API_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load history.");
  }
  return data;
}

export async function sendDebugRequest(token, payload) {
  const response = await fetch(`${API_BASE}/debugger/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.details || data.error || "Debug request failed.");
  }
  return data;
}
