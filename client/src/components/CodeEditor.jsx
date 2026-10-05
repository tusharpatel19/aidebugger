import Editor from "@monaco-editor/react";

function CodeEditor({ language, value, onChange }) {
  return (
    <div className="field-block">
      <label>Code</label>
      <div className="code-editor-frame">
        <Editor
          height="360px"
          language={language}
          theme="vs-dark"
          value={value}
          onChange={(nextValue) => onChange(nextValue || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
