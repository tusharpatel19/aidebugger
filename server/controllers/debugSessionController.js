const DebugSession = require("../models/DebugSession.js");
const { runAgentWorkflow } = require("../services/agentService.js");

const SUPPORTED_LANGUAGES = new Set(["python", "c", "cpp", "java", "javascript"]);

async function startDebugSession(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const language = body.language || "python";
  const sourceCode = typeof body.sourceCode === "string"
    ? body.sourceCode
    : typeof body.code === "string"
      ? body.code
      : "";
  const error = body.error === undefined ? "" : body.error;

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return res.status(400).json({
      error: `Unsupported language. Choose one of: ${[...SUPPORTED_LANGUAGES].join(", ")}.`,
    });
  }

  if (!sourceCode.trim()) {
    return res.status(400).json({ error: "sourceCode is required." });
  }
  if (sourceCode.length > 100000) {
    return res.status(400).json({ error: "sourceCode exceeds the 100000-character limit." });
  }
  if (typeof error !== "string" || error.length > 8000) {
    return res.status(400).json({ error: "error must be text no longer than 8000 characters." });
  }
  if (body.testCases !== undefined) {
    return res.status(400).json({
      error: "Test execution is disabled in this version. Remove testCases and request an AI code review instead.",
    });
  }

  const session = await DebugSession.create({
    userId: req.userId,
    language,
    originalCode: sourceCode,
    currentCode: sourceCode,
    error,
    status: "running",
    events: [{ agent: "workflow", status: "started", summary: "AI review started." }],
  });

  try {
    const result = await runAgentWorkflow({ language, sourceCode, error });
    session.currentCode = result.currentCode || sourceCode;
    session.diagnosis = result.diagnosis || null;
    session.iterations = result.iterations || 0;
    session.events = result.events || session.events;
    session.status = result.status || "completed";
    await session.save();
    return res.status(201).json({ sessionId: session._id, session });
  } catch (err) {
    session.status = "agent_error";
    session.events.push({
      agent: "workflow",
      status: "failed",
      summary: err.message || "Agent service failed.",
    });
    await session.save();
    return res.status(502).json({
      error: err.message || "AI review failed. Please try again.",
      sessionId: session._id,
      session,
    });
  }
}

async function getDebugSession(req, res) {
  const session = await DebugSession.findOne({ _id: req.params.id, userId: req.userId });
  if (!session) {
    return res.status(404).json({ error: "Debug session not found." });
  }

  return res.json(session);
}

async function fetchDebugHistory(req, res) {
  const sessions = await DebugSession.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(50);
  return res.json(sessions);
}

module.exports = { startDebugSession, getDebugSession, fetchDebugHistory };
