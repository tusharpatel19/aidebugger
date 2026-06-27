const crypto = require("crypto");
const User = require("../models/User.js");
const { createAuthToken } = require("../middleware/authMiddleware.js");

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
  return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(user.passwordHash, "hex"));
}

async function signup(req, res) {
  try {
    const { name = "", email = "", password = "" } = req.body;
    if (!name.trim() || !email.trim() || password.length < 6) {
      return res.status(400).json({ error: "Name, valid email and password (min 6 chars) are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const { salt, passwordHash } = createPasswordRecord(password);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, salt });
    const token = createAuthToken(user._id.toString());

    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email = "", password = "" } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createAuthToken(user._id.toString());
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { signup, login, getCurrentUser };
