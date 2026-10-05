const mongoose = require("mongoose");
const { MemoryUser } = require("../services/memoryStore.js");

if (process.env.USE_MEMORY_DB === "true") {
  module.exports = MemoryUser;
  return;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
