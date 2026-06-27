const crypto = require("crypto");

const AUTH_SECRET = process.env.AUTH_SECRET || "change-this-in-production";

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function createAuthToken(userId) {
  const payload = base64UrlEncode(
    JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
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

module.exports = { requireAuth, createAuthToken };
