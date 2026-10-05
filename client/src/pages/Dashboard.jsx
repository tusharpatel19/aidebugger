import { useRef, useState } from "react";
import AgentActivityPanel from "../components/AgentActivityPanel.jsx";
import CodeEditor from "../components/CodeEditor.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import ResultPanel from "../components/ResultPanel.jsx";
import { sendDebugRequest } from "../services/api.js";

const sampleCode = {
  python: "numbers = [1, 2, 3]\nfor i in range(len(numbers)):\n    print(numbers[i + 1])",
  c: '#include <stdio.h>\nint main(void) {\n    int numbers[] = {1, 2, 3};\n    for (int i = 0; i <= 3; i++) printf("%d\\n", numbers[i]);\n    return 0;\n}',
  cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> numbers{1, 2, 3};\n    for (int i = 0; i <= numbers.size(); i++) std::cout << numbers[i] << "\\n";\n}',
  java: "class Main {\n    public static void main(String[] args) {\n        int[] numbers = {1, 2, 3};\n        for (int i = 0; i <= numbers.length; i++) System.out.println(numbers[i]);\n    }\n}",
  javascript: "const numbers = [1, 2, 3];\nfor (let i = 0; i <= numbers.length; i++) {\n  console.log(numbers[i]);\n}",
};

function Dashboard({ token }) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(sampleCode.python);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const outputRef = useRef(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setApiError("Please enter some code.");
      return;
    }

    setApiError("");
    setLoading(true);
    setEvents([{ agent: "workflow", status: "started", summary: "Sending code to the agent workflow..." }]);
    try {
      const data = await sendDebugRequest(token, { language, sourceCode: code, error });
      setResult(data);
      setEvents(data.session?.events || []);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setApiError(err.message || "Request failed.");
      setEvents((current) => [
        ...current,
        { agent: "workflow", status: "failed", summary: err.message || "Request failed." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="panel input-panel">
        <h2>AI Debugger</h2>
        <LanguageSelector
          language={language}
          onLanguageChange={(nextLanguage) => {
            setLanguage(nextLanguage);
            setCode(sampleCode[nextLanguage]);
            setResult(null);
            setEvents([]);
          }}
        />
        <CodeEditor language={language} value={code} onChange={setCode} />
        <div className="field-block">
          <label>Error / Notes</label>
          <textarea
            rows="4"
            value={error}
            onChange={(e) => setError(e.target.value)}
            placeholder="Optional error or exception message"
          />
        </div>
        <div className="submit-row">
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze and suggest fix"}
          </button>
          <p className="hint">AI reviews the code and returns a diagnosis and suggested correction. Code is not executed.</p>
        </div>
        {apiError && <p className="form-error">{apiError}</p>}
      </section>
      <div className="side-stack">
        <AgentActivityPanel events={events} loading={loading} />
        <div ref={outputRef}>
          <ResultPanel result={result} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
