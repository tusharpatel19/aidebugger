import { Link, useLocation } from "react-router-dom";

function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="brand">AI Debugger</div>
      <nav>
        {user ? (
          <>
            <Link className={location.pathname === "/dashboard" ? "active" : ""} to="/dashboard">
              Dashboard
            </Link>
            <Link className={location.pathname === "/history" ? "active" : ""} to="/history">
              History
            </Link>
            <button type="button" className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className={location.pathname === "/login" ? "active" : ""} to="/login">
              Login
            </Link>
            <Link className={location.pathname === "/register" ? "active" : ""} to="/register">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
