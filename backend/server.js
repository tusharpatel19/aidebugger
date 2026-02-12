const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const AUTH_SECRET = process.env.AUTH_SECRET || "change-this-in-production";
const SUPPORTED_LANGUAGES = ["c", "cpp", "java", "python"];
const SUPPORTED_TASKS = [
  "debug-fix",
  "explain-error",
  "run-output",
  "complexity",
  "test-cases",
];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: { type: String, enum: ["user", "assistant"], required: true },
  text: { type: String, required: true },
  language: { type: String, enum: SUPPORTED_LANGUAGES, required: true },
  taskType: { type: String, enum: SUPPORTED_TASKS, required: true },
  code: { type: String, default: "" },
  error: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  return { salt, passwordHash };
}

function verifyPassword(password, user) {
  const digest = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(
    Buffer.from(digest, "hex"),
    Buffer.from(user.passwordHash, "hex")
  );
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function createAuthToken(userId) {
  const payload = base64UrlEncode(
    JSON.stringify({
      userId,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  );
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function parseAuthToken(token) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(payload));
    if (!decoded.userId || !decoded.exp || decoded.exp < Date.now()) return null;
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const userId = parseAuthToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  return next();
}

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
    throw new Error("GROQ_API_KEY is missing in backend/.env");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a precise debugging assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
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

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body;
    if (!name.trim() || !email.trim() || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Name, valid email and password (min 6 chars) are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const { salt, passwordHash } = createPasswordRecord(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      salt,
    });

    const token = createAuthToken(user._id.toString());
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createAuthToken(user._id.toString());
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/messages", requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/debugger/chat", requireAuth, async (req, res) => {
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

    const userText = [
      `Task: ${taskType}`,
      `Language: ${language}`,
      resolvedQuestion,
    ].join("\n");

    const userMessage = await Message.create({
      userId: req.userId,
      role: "user",
      text: userText,
      language,
      taskType,
      code,
      error,
    });

    const prompt = buildPrompt({
      language,
      taskType,
      code,
      error,
      question: resolvedQuestion,
    });
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
    return res.status(500).json({
      error: "Failed to process debugging request.",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
