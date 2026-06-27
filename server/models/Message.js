const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  text: { type: String, required: true },
  language: { type: String, enum: ["c", "cpp", "java", "python"], required: true },
  taskType: {
    type: String,
    enum: ["debug-fix", "explain-error", "run-output", "complexity", "test-cases"],
    required: true,
  },
  code: { type: String, default: "" },
  error: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
