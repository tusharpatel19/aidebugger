const jwt = require("jsonwebtoken");

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Configure it in server/.env.");
  }
  return process.env.JWT_SECRET;
}

function createAuthToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

function parseAuthToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded.userId) return null;
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

module.exports = { requireAuth, createAuthToken };
