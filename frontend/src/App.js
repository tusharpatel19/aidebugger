import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";
const languageOptions = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
];
const taskOptions = [
  { value: "debug-fix", label: "Debug + Fix Code" },
  { value: "explain-error", label: "Explain Error Step by Step" },
  { value: "run-output", label: "Run Code Output (Simulated)" },
  { value: "complexity", label: "Complexity Analysis" },
  { value: "test-cases", label: "Test Case Generator" },
];

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [user, setUser] = useState(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState("python");
  const [taskType, setTaskType] = useState("debug-fix");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    loadCurrentUser();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    loadHistory();
  }, [token, user]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const groupedHistory = useMemo(() => {
    const grouped = {};
    messages.forEach((message) => {
      const key = `${message.language || "unknown"}:${message.taskType || "unknown"}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(message);
    });
    return grouped;
  }, [messages]);

  async function authRequest(path, payload) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Authentication failed.");
    }
    return data;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const payload =
        authMode === "signup"
          ? { name: authName, email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword };
      const path = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await authRequest(path, payload);
      localStorage.setItem("auth_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadCurrentUser() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Session expired.");
      setUser(data);
      setAuthError("");
    } catch (err) {
      localStorage.removeItem("auth_token");
      setToken("");
      setUser(null);
      setMessages([]);
      setAuthError("Please login again.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    setToken("");
    setUser(null);
    setMessages([]);
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load chat history.");
      setMessages(data);
      setApiError("");
    } catch (err) {
      setApiError(err.message || "Failed to load chat history.");
    }
  }

  async function handleSubmit() {
    if (!code.trim()) {
      setApiError("Please paste your code first.");
      return;
    }

    setApiError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/debugger/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language,
          taskType,
          code,
          error,
          question,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || "Request failed.");
      }

      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      setQuestion("");
    } catch (err) {
      setApiError(err.message || "Failed to send request.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !user) {
    return (
      <div className="page-shell">
        <div className="auth-layout">
          <section className="brand-card">
            <p className="eyebrow">MERN AI SUITE</p>
            <h1>AI Code Debugger Chatbot</h1>
            <p>
              Login or signup to use language-aware debugging, error explanation, simulated output,
              complexity analysis, and test-case generation.
            </p>
            <ul>
              <li>C, C++, Java, Python</li>
              <li>Step-by-step fix guidance</li>
              <li>Private chat history per account</li>
            </ul>
          </section>

          <section className="auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => setAuthMode("signup")}
              >
                Signup
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === "signup" && (
                <label>
                  Full Name
                  <input
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </label>

              {authError && <p className="error-text">{authError}</p>}

              <button type="submit" className="primary-btn" disabled={authLoading}>
                {authLoading
                  ? "Please wait..."
                  : authMode === "signup"
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI DEBUGGER</p>
          <h1>AI Code Debugger Chatbot</h1>
        </div>
        <div className="user-panel">
          <div>
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.email}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-grid">
        <section className="card input-card">
          <p className="section-title">Debugger Input</p>
          <p className="section-subtitle">
            Select language and task, paste code/error, and get step-by-step debugging help.
          </p>

          <div className="form-grid">
            <label>
              Language
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {languageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Task
              <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                {taskOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Code
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={10}
                placeholder="Paste your code here..."
                className="code-box"
              />
            </label>

            <label>
              Error Message
              <textarea
                value={error}
                onChange={(e) => setError(e.target.value)}
                rows={4}
                placeholder="Paste compile/runtime error..."
                className="code-box"
              />
            </label>

            <label>
              Question
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="Optional: e.g. fix only syntax errors, explain in Hindi, optimize too."
              />
            </label>

            {apiError && <p className="error-text">{apiError}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="primary-btn"
            >
              {loading ? "Analyzing..." : "Analyze Code + Fix"}
            </button>
          </div>
        </section>

        <section className="card chat-card">
          <p className="section-title">Chat</p>
          <div className="chat-feed">
            {messages.map((msg) => (
              <article
                key={msg._id || `${msg.role}-${msg.timestamp}`}
                className={`chat-item ${msg.role === "assistant" ? "assistant" : "user"}`}
              >
                <div className="meta-row">
                  <span className="pill">{msg.role}</span>
                  {msg.language && <span>{msg.language.toUpperCase()}</span>}
                  {msg.taskType && <span>{msg.taskType}</span>}
                  {msg.timestamp && <span>{new Date(msg.timestamp).toLocaleString()}</span>}
                </div>
                <pre>{msg.text}</pre>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        <aside className="card history-card">
          <p className="section-title">History Summary</p>
          <div className="history-list">
            {Object.keys(groupedHistory).length === 0 && (
              <p className="section-subtitle">No history yet.</p>
            )}
            {Object.entries(groupedHistory).map(([key, items]) => (
              <div key={key} className="history-item">
                <p>{key}</p>
                <small>{items.length} message(s)</small>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
