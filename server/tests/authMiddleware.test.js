const assert = require("node:assert/strict");
const test = require("node:test");

process.env.JWT_SECRET ||= "test-only-jwt-secret-for-unit-tests";
const { createAuthToken, requireAuth } = require("../middleware/authMiddleware.js");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("requireAuth accepts a valid JWT token", () => {
  const token = createAuthToken("user-123");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();
  let nextCalled = false;

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.userId, "user-123");
});

test("requireAuth rejects a missing token", () => {
  const req = { headers: {} };
  const res = createResponse();

  requireAuth(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("createAuthToken requires a configured JWT secret", () => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  assert.throws(() => createAuthToken("user-123"), /JWT_SECRET is required/);

  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});
