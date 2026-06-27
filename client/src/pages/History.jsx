import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api.js";

function History({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHistory(token);
        setHistory(data);
      } catch (err) {
        setError(err.message || "Unable to load history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  return (
    <div className="history-page">
      <h2>Chat History</h2>
      {loading && <p>Loading history...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !history.length && <p>No history available yet.</p>}
      <div className="history-list">
        {history.map((item) => (
          <article key={item._id} className="history-item">
            <div className="history-meta">
              <span>{item.taskType}</span>
              <span>{item.language}</span>
              <span>{new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div className="history-text">
              <strong>{item.role === "user" ? "User" : "Assistant"}:</strong>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default History;
