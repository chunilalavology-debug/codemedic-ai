import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  }),
}));

vi.mock("@/lib/history", () => ({
  saveAnalysis: vi.fn().mockResolvedValue(null),
}));

const MOCK_RESPONSE = {
  language: "typescript",
  explanation: "Test explanation",
  rootCause: "Test root cause",
  fixedCode: "const x = 1;",
  diff: [],
  errors: [],
  securityIssues: [],
  performanceIssues: [],
  confidence: 0.95,
};

describe("analyzeCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = "test-key";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(MOCK_RESPONSE) } }],
    });
  });

  it("returns a valid AnalysisResult shape", async () => {
    const { analyzeCode } = await import("@/lib/claude");
    const result = await analyzeCode({
      code: "const x: string = 1;",
      analysisType: "error",
    });

    expect(result).toMatchObject({
      language: "typescript",
      explanation: expect.any(String),
      rootCause: expect.any(String),
      fixedCode: expect.any(String),
      diff: expect.any(Array),
      errors: expect.any(Array),
      securityIssues: expect.any(Array),
      performanceIssues: expect.any(Array),
      confidence: expect.any(Number),
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.analysisType).toBe("error");
  });

  it("falls back to mock mode when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;
    vi.resetModules();
    const { analyzeCode } = await import("@/lib/claude");
    const result = await analyzeCode({
      code: "def hello(): pass",
      analysisType: "all",
    });
    expect(result.id).toBeDefined();
    expect(typeof result.confidence).toBe("number");
  });
});
