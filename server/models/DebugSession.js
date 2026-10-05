const mongoose = require("mongoose");
const { MemoryDebugSession } = require("../services/memoryStore.js");

if (process.env.USE_MEMORY_DB === "true") {
  module.exports = MemoryDebugSession;
  return;
}

const agentEventSchema = new mongoose.Schema(
  {
    agent: { type: String, required: true },
    status: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { _id: false }
);

const diagnosisSchema = new mongoose.Schema(
  {
    rootCause: { type: String, default: "" },
    explanation: { type: String, default: "" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    suggestedFix: { type: String, default: "" },
  },
  { _id: false }
);

const debugSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    language: { type: String, enum: ["python", "c", "cpp", "java", "javascript"], required: true },
    originalCode: { type: String, required: true },
    error: { type: String, default: "" },
    currentCode: { type: String, default: "" },
    diagnosis: { type: diagnosisSchema, default: null },
    iterations: { type: Number, default: 1 },
    events: { type: [agentEventSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "agent_error"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DebugSession", debugSessionSchema);
