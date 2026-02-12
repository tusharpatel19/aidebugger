import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders debugger chatbot heading", () => {
  render(<App />);
  const heading = screen.getByText(/ai code debugger chatbot/i);
  expect(heading).toBeInTheDocument();
});
