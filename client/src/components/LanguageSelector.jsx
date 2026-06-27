function LanguageSelector({ language, taskType, onLanguageChange, onTaskTypeChange }) {
  return (
    <div className="two-column">
      <div className="field-block">
        <label>Language</label>
        <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <div className="field-block">
        <label>Task</label>
        <select value={taskType} onChange={(e) => onTaskTypeChange(e.target.value)}>
          <option value="debug-fix">Debug + Fix</option>
          <option value="explain-error">Explain Error</option>
          <option value="run-output">Run Output</option>
          <option value="complexity">Complexity</option>
          <option value="test-cases">Test Cases</option>
        </select>
      </div>
    </div>
  );
}

export default LanguageSelector;
