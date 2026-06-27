function OutputBox({ title, children }) {
  return (
    <div className="output-box">
      <h3>{title}</h3>
      <div className="output-content">{children}</div>
    </div>
  );
}

export default OutputBox;
