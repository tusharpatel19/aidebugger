const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

process.env.USE_MEMORY_DB = "true";
process.env.JWT_SECRET ||= "test-only-jwt-secret-for-unit-tests";

const User = require("../models/User.js");
const { login, signup } = require("../controllers/authController.js");

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

test("signup hashes passwords and login verifies them", async () => {
  const email = `${crypto.randomUUID()}@example.test`;
  const signupResponse = createResponse();

  await signup(
    { body: { name: "Test User", email, password: "secret-pass-123" } },
    signupResponse
  );

  assert.equal(signupResponse.statusCode, 200);
  assert.ok(signupResponse.body.token);
  const storedUser = await User.findOne({ email });
  assert.notEqual(storedUser.passwordHash, "secret-pass-123");
  assert.match(storedUser.passwordHash, /^\$2/);

  const loginResponse = createResponse();
  await login(
    { body: { email, password: "secret-pass-123" } },
    loginResponse
  );
  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.body.token);

  const rejectedResponse = createResponse();
  await login(
    { body: { email, password: "incorrect-password" } },
    rejectedResponse
  );
  assert.equal(rejectedResponse.statusCode, 401);
});
