const Message = require("../models/Message.js");

const SUPPORTED_LANGUAGES = ["c", "cpp", "java", "python"];
const SUPPORTED_TASKS = ["debug-fix", "explain-error", "run-output", "complexity", "test-cases"];

function buildPrompt({ language, taskType, code, error, question }) {
  return `
You are a senior code debugging assistant.
Language: ${language.toUpperCase()}
Task type: ${taskType}

User code:
${code || "(No code shared)"}

Error message:
${error || "(No error shared)"}

User question:
${question || "(No custom question provided)"}

Rules:
1) Respond with clear markdown headings.
2) Always include "Step-by-step explanation".
3) For debug-fix tasks, first list all detected errors (compile + logical/runtime risk), then include "Fixed code" in a code block.
4) For run-output tasks, clearly label output as "Expected output (simulated)".
5) For complexity tasks, include both time and space complexity.
6) For test-cases tasks, include normal, edge, and stress cases.
7) Keep answers practical and concise.
`;
}

async function askGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in server/.env");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a precise debugging assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "No response generated.";
}

async function chat(req, res) {
  try {
    const { language, taskType, code = "", error = "", question = "" } = req.body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: "Unsupported language." });
    }
    if (!SUPPORTED_TASKS.includes(taskType)) {
      return res.status(400).json({ error: "Unsupported task type." });
    }
    if (!code.trim()) {
      return res.status(400).json({ error: "Code is required." });
    }

    const resolvedQuestion =
      question.trim() ||
      (taskType === "debug-fix"
        ? "Find all errors in this code and provide corrected code with explanation."
        : `Perform ${taskType} on this code.`);

    const userText = [`Task: ${taskType}`, `Language: ${language}`, resolvedQuestion].join("\n");

    const userMessage = await Message.create({
      userId: req.userId,
      role: "user",
      text: userText,
      language,
      taskType,
      code,
      error,
    });

    const prompt = buildPrompt({ language, taskType, code, error, question: resolvedQuestion });
    const answer = await askGroq(prompt);

    const assistantMessage = await Message.create({
      userId: req.userId,
      role: "assistant",
      text: answer,
      language,
      taskType,
      code,
      error,
    });

    return res.json({ userMessage, assistantMessage });
  } catch (err) {
    console.error("Debugger endpoint error:", err);
    return res.status(500).json({ error: "Failed to process debugging request.", details: err.message });
  }
}

module.exports = { chat };
