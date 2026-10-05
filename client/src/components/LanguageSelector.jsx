function LanguageSelector({ language, onLanguageChange }) {
  return (
    <div className="field-block">
      <label>Language</label>
      <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
        <option value="python">Python</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript (Node.js)</option>
      </select>
    </div>
  );
}

export default LanguageSelector;
