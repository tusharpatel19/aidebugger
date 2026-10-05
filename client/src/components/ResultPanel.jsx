function ResultPanel({ result }) {
  if (!result) {
    return (
      <section className="panel result-panel">
        <h2>Result</h2>
        <p className="empty-state">Analyze code to see the diagnosis and suggested fix.</p>
      </section>
    );
  }

  const session = result.session || result;
  const diagnosis = session.diagnosis;

  return (
    <section className="panel result-panel">
      <div className="result-header">
        <h2>Result</h2>
        <div className="result-badges">
          <span className="language-pill">{session.language || "unknown"}</span>
          <span className={`status-pill ${session.status}`}>{session.status}</span>
        </div>
      </div>

      <div className="result-grid">
        <div>
          <h3>Bug Explanation</h3>
          <p>{diagnosis?.explanation || "No diagnosis available."}</p>
          {diagnosis?.rootCause && <p><strong>Root cause:</strong> {diagnosis.rootCause}</p>}
          {diagnosis?.suggestedFix && <p><strong>Suggested fix:</strong> {diagnosis.suggestedFix}</p>}
        </div>
        <div>
          <h3>AI Review</h3>
          <p><strong>Language:</strong> {session.language}</p>
          <p><strong>Review passes:</strong> {session.iterations || 1}</p>
        </div>
      </div>

      <div className="code-compare">
        <div>
          <h3>Original Code</h3>
          <pre>{session.originalCode}</pre>
        </div>
        <div>
          <h3>Fixed Code</h3>
          <pre>{session.currentCode}</pre>
        </div>
      </div>
    </section>
  );
}

export default ResultPanel;
