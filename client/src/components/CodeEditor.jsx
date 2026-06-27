function CodeEditor({ value, onChange }) {
  return (
    <div className="field-block">
      <label>Code</label>
      <textarea
        className="code-input"
        rows="14"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your code here"
      />
    </div>
  );
}

export default CodeEditor;
