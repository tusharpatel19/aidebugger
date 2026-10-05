const assert = require("node:assert/strict");
const test = require("node:test");

process.env.USE_MEMORY_DB = "true";
const { startDebugSession } = require("../controllers/debugSessionController.js");
const { fetchDebugHistory, getDebugSession } = require("../controllers/debugSessionController.js");

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

test("startDebugSession rejects unsupported languages", async () => {
  const req = {
    userId: "user-123",
    body: { language: "rust", sourceCode: "fn main() {}" },
  };
  const res = createResponse();

  await startDebugSession(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Unsupported language/);
});

test("startDebugSession requires source code", async () => {
  const req = {
    userId: "user-123",
    body: { language: "python", sourceCode: "" },
  };
  const res = createResponse();

  await startDebugSession(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "sourceCode is required.");
});

test("startDebugSession clearly rejects disabled test execution", async () => {
  const res = createResponse();
  await startDebugSession(
    {
      userId: "user-123",
      body: { language: "python", sourceCode: "print(1)", testCases: [] },
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Test execution is disabled/);
});

test("debug sessions retain the selected language and are scoped to their owner", async () => {
  const previousFetch = global.fetch;
  const previousApiKey = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = "unit-test-key";
  global.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const agent = request.messages[0].content;
    const content = agent.startsWith("You are Debugger Agent")
      ? JSON.stringify({
          rootCause: "Sample issue",
          explanation: "Sample explanation",
          severity: "low",
          suggestedFix: "Correct the sample.",
        })
      : JSON.stringify({ fixedCode: "corrected sample", explanation: "Prepared a corrected sample." });
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content } }],
      }),
    };
  };

  try {
    for (const language of ["python", "c", "cpp", "java", "javascript"]) {
      const createRes = createResponse();
      await startDebugSession(
        {
          userId: `user-${language}`,
          body: { language, sourceCode: "valid sample" },
        },
        createRes
      );
      assert.equal(createRes.statusCode, 201);
      assert.equal(createRes.body.session.language, language);
      assert.equal(createRes.body.session.status, "completed");
      assert.equal(createRes.body.session.currentCode, "corrected sample");
      const ownResponse = createResponse();
      await getDebugSession(
        { userId: `user-${language}`, params: { id: createRes.body.sessionId } },
        ownResponse
      );
      assert.equal(ownResponse.body.language, language);

      const otherUserResponse = createResponse();
      await getDebugSession(
        { userId: "different-user", params: { id: createRes.body.sessionId } },
        otherUserResponse
      );
      assert.equal(otherUserResponse.statusCode, 404);
    }

    const historyResponse = createResponse();
    await fetchDebugHistory({ userId: "user-cpp" }, historyResponse);
    assert.equal(historyResponse.body.length, 1);
    assert.equal(historyResponse.body[0].language, "cpp");
  } finally {
    global.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousApiKey;
  }
});

test("startDebugSession records an agent failure", async () => {
  const previousFetch = global.fetch;
  const previousApiKey = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = "unit-test-key";
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const res = createResponse();
  try {
    await startDebugSession(
      { userId: "agent-error-user", body: { language: "python", sourceCode: "print(1)" } },
      res
    );
  } finally {
    global.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousApiKey;
  }

  assert.equal(res.statusCode, 502);
  assert.equal(res.body.session.status, "agent_error");
});
