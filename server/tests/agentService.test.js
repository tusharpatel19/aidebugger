const assert = require("node:assert/strict");
const test = require("node:test");

const { runAgentWorkflow } = require("../services/agentService.js");

const diagnosis = {
  rootCause: "The loop reads beyond the array.",
  explanation: "The final iteration uses an index that is outside the array.",
  severity: "medium",
  suggestedFix: "Stop the loop before the last index.",
};

function fakeProvider(resultBySystemPrompt, requests) {
  return async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    const systemPrompt = request.messages[0].content;
    const result = systemPrompt.startsWith("You are Debugger Agent")
      ? resultBySystemPrompt.debugger
      : resultBySystemPrompt.fixer;
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(result) } }],
      }),
    };
  };
}

test("two AI agents receive language context and return a diagnosis and fix", async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.LLM_API_KEY;
  const previousUrl = process.env.LLM_BASE_URL;
  const previousModel = process.env.LLM_MODEL;
  const requests = [];
  process.env.LLM_API_KEY = "unit-test-key";
  process.env.LLM_BASE_URL = "https://provider.example/v1/";
  process.env.LLM_MODEL = "test-model";
  global.fetch = fakeProvider(
    {
      debugger: diagnosis,
      fixer: { fixedCode: "fixed source", explanation: "Corrected the loop." },
    },
    requests
  );

  try {
    const result = await runAgentWorkflow({
      language: "cpp",
      sourceCode: "broken source",
      error: "index out of range",
    });

    assert.equal(result.language, "cpp");
    assert.equal(result.status, "completed");
    assert.equal(result.currentCode, "fixed source");
    assert.deepEqual(result.diagnosis, diagnosis);
    assert.equal(result.events.filter((event) => event.status === "completed").length, 3);
    assert.equal(requests.length, 2);
    assert.match(requests[0].messages[1].content, /Language: cpp/);
    assert.match(requests[1].messages[1].content, /Language: cpp/);
    assert.equal(requests[0].model, "test-model");
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.LLM_BASE_URL;
    else process.env.LLM_BASE_URL = previousUrl;
    if (previousModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = previousModel;
  }
});

test("AI service requires an API key", async () => {
  const previousKey = process.env.LLM_API_KEY;
  const previousGroqKey = process.env.GROQ_API_KEY;
  delete process.env.LLM_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    await assert.rejects(
      runAgentWorkflow({ language: "python", sourceCode: "print(1)" }),
      /LLM_API_KEY is missing/
    );
  } finally {
    if (previousKey !== undefined) process.env.LLM_API_KEY = previousKey;
    if (previousGroqKey !== undefined) process.env.GROQ_API_KEY = previousGroqKey;
  }
});

test("AI service accepts the previous Groq key setting", async () => {
  const previousKey = process.env.LLM_API_KEY;
  const previousGroqKey = process.env.GROQ_API_KEY;
  delete process.env.LLM_API_KEY;
  process.env.GROQ_API_KEY = "unit-test-key";
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = fakeProvider(
    {
      debugger: diagnosis,
      fixer: { fixedCode: "fixed source", explanation: "Corrected the loop." },
    },
    requests
  );

  try {
    const result = await runAgentWorkflow({ language: "python", sourceCode: "source" });
    assert.equal(result.status, "completed");
    assert.equal(requests.length, 2);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousKey;
    if (previousGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousGroqKey;
  }
});

test("AI service uses an active default Groq model when none is set", async () => {
  const previousKey = process.env.LLM_API_KEY;
  const previousGroqKey = process.env.GROQ_API_KEY;
  const previousModel = process.env.LLM_MODEL;
  const previousGroqModel = process.env.GROQ_MODEL;
  delete process.env.LLM_API_KEY;
  process.env.GROQ_API_KEY = "unit-test-key";
  delete process.env.LLM_MODEL;
  delete process.env.GROQ_MODEL;
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = fakeProvider(
    {
      debugger: diagnosis,
      fixer: { fixedCode: "fixed source", explanation: "Corrected the loop." },
    },
    requests
  );

  try {
    await runAgentWorkflow({ language: "python", sourceCode: "source" });
    assert.equal(requests[0].model, "openai/gpt-oss-120b");
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousKey;
    if (previousGroqKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousGroqKey;
    if (previousModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = previousModel;
    if (previousGroqModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = previousGroqModel;
  }
});

test("AI service returns useful provider errors without exposing credentials", async () => {
  const previousFetch = global.fetch;
  const previousKey = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = "do-not-print-this";
  global.fetch = async () => ({ ok: false, status: 503 });

  try {
    await assert.rejects(
      runAgentWorkflow({ language: "python", sourceCode: "print(1)" }),
      (error) => {
        assert.match(error.message, /status 503/);
        assert.equal(error.message.includes("do-not-print-this"), false);
        return true;
      }
    );
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousKey;
  }
});
