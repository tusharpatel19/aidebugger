import { useMemo, useRef, useState } from "react";
import CodeEditor from "../components/CodeEditor.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import OutputBox from "../components/OutputBox.jsx";
import { sendDebugRequest } from "../services/api.js";

const defaultCode = `function example() {\n  console.log(\"Hello world!\");\n}`;

function Dashboard({ token }) {
  const [language, setLanguage] = useState("python");
  const [taskType, setTaskType] = useState("debug-fix");
  const [code, setCode] = useState(defaultCode);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const outputRef = useRef(null);

  const promptHelp = useMemo(() => {
    if (taskType === "debug-fix") return "Paste code and any error text to receive fixes and explanation.";
    if (taskType === "explain-error") return "Describe the error and code to get step-by-step explanation.";
    if (taskType === "run-output") return "Get simulated output for the given code.";
    if (taskType === "complexity") return "Get time and space complexity analysis.";
    return "Generate normal, edge, and stress test cases for the code.";
  }, [taskType]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setApiError("Please enter some code.");
      return;
    }

    setApiError("");
    setLoading(true);
    try {
      const data = await sendDebugRequest(token, { language, taskType, code, error, question });
      setResult(data.assistantMessage.text);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setApiError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="panel">
        <h2>Debugger</h2>
        <LanguageSelector
          language={language}
          taskType={taskType}
          onLanguageChange={setLanguage}
          onTaskTypeChange={setTaskType}
        />
        <CodeEditor value={code} onChange={setCode} />
        <div className="field-block">
          <label>Error / Notes</label>
          <textarea
            rows="4"
            value={error}
            onChange={(e) => setError(e.target.value)}
            placeholder="Optional compilation or runtime error message"
          />
        </div>
        <div className="field-block">
          <label>Custom question</label>
          <textarea
            rows="3"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Optional clarifying question"
          />
        </div>
        <div className="submit-row">
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Send to debugger"}
          </button>
          <p className="hint">{promptHelp}</p>
        </div>
        {apiError && <p className="form-error">{apiError}</p>}
      </section>
      <section ref={outputRef} className="panel output-panel">
        <OutputBox title="Assistant Response">
          <pre>{result || "No response yet."}</pre>
        </OutputBox>
      </section>
    </div>
  );
}

export default Dashboard;
