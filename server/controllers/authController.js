const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const { createAuthToken } = require("../middleware/authMiddleware.js");

function hashLegacyPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function createPasswordRecord(password) {
  const passwordHash = await bcrypt.hash(password, 12);
  return { passwordHash, salt: "" };
}

async function verifyPassword(password, user) {
  if (user.passwordHash.startsWith("$2")) {
    return bcrypt.compare(password, user.passwordHash);
  }

  if (!user.salt) return false;
  const digest = hashLegacyPassword(password, user.salt);
  const matches = crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(user.passwordHash, "hex"));
  if (matches) {
    user.passwordHash = await bcrypt.hash(password, 12);
    user.salt = "";
    await user.save();
  }
  return matches;
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

    const { salt, passwordHash } = await createPasswordRecord(password);
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
    if (!user || !(await verifyPassword(password, user))) {
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
