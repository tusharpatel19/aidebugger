import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    setUser(stored ? JSON.parse(stored) : null);
  }, [token]);

  const handleLogin = (data) => {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken("");
    setUser(null);
  };

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="page-container">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />
          <Route path="/login" element={<Login onSuccess={handleLogin} />} />
          <Route path="/register" element={<Register onSuccess={handleLogin} />} />
          <Route path="/dashboard" element={user ? <Dashboard token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/history" element={user ? <History token={token} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
