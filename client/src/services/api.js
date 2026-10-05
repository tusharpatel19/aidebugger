import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function authRequest(path, payload) {
  try {
    const response = await api.post(path, payload);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Server error.");
  }
}

export async function fetchCurrentUser(token) {
  try {
    const response = await api.get("/auth/me", { headers: authHeaders(token) });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to fetch user.");
  }
}

export async function fetchHistory(token) {
  try {
    const response = await api.get("/debug/history", { headers: authHeaders(token) });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || "Failed to load history.");
  }
}

export async function sendDebugRequest(token, payload) {
  try {
    const response = await api.post("/debug", payload, { headers: authHeaders(token) });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.details || err.response?.data?.error || "Debug request failed.");
  }
}
