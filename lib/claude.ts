import Groq from "groq-sdk";
import type { AnalysisResult, AnalyzeRequest, Language } from "@/types";
import { detectLanguage } from "@/lib/utils";

const MODEL = "llama-3.3-70b-versatile";

function getMockResult(req: AnalyzeRequest): AnalysisResult {
  const lang = req.language ?? detectLanguage(req.code, req.fileName);
  const lines = req.code.split("\n");

  return {
    id: crypto.randomUUID(),
    analysisType: req.analysisType,
    createdAt: new Date().toISOString(),
    language: lang,
    explanation:
      "CodeMedic AI detected several issues in your code. The function is missing input validation, contains a potential null reference on line 3, and uses a deprecated API pattern. These issues could cause runtime crashes in production.",
    rootCause:
      "The primary issue is an unhandled null dereference — the variable is accessed before being checked for existence, which will throw a TypeError at runtime.",
    fixedCode: req.code
      .replace(/var /g, "const ")
      .replace(/console\.log/g, "// console.log"),
    diff: lines.slice(0, 8).map((content, i) => ({
      type: (i === 2 ? "removed" : i === 3 ? "added" : "unchanged") as
        | "removed"
        | "added"
        | "unchanged",
      content,
      lineNumber: i + 1,
    })),
    errors: [
      {
        line: 3,
        column: 5,
        message: "Variable may be null or undefined before use",
        type: "TypeError",
      },
      {
        line: 7,
        column: 1,
        message: "Missing return type annotation",
        type: "TypeError",
      },
    ],
    securityIssues:
      req.analysisType === "error"
        ? []
        : [
            {
              id: "SEC-001",
              title: "Unsanitized User Input",
              severity: "high",
              description:
                "User-supplied data is passed directly into a sensitive operation without sanitization, enabling injection attacks.",
              line: 5,
              recommendation:
                "Validate and sanitize all user input before processing. Use a whitelist approach.",
              cweId: "CWE-20",
            },
            {
              id: "SEC-002",
              title: "Hardcoded Credential",
              severity: "critical",
              description:
                "A secret key or password appears to be hardcoded in the source code.",
              line: 9,
              recommendation:
                "Move secrets to environment variables and use a secrets manager in production.",
              cweId: "CWE-798",
            },
          ],
    performanceIssues:
      req.analysisType === "error"
        ? []
        : [
            {
              id: "PERF-001",
              title: "Synchronous I/O in Hot Path",
              impact: "high",
              description:
                "A blocking synchronous call is made inside a loop, causing the event loop to stall on every iteration.",
              line: 6,
              recommendation:
                "Replace with the async equivalent and use Promise.all for parallel execution.",
              estimatedGain: "~60% faster",
            },
          ],
    confidence: 0.91,
  };
}

function buildAnalysisPrompt(req: AnalyzeRequest): string {
  const langHint =
    req.language && req.language !== "unknown"
      ? `Language: ${req.language}`
      : "Detect the language automatically.";

  const errorSection = req.errorMessage
    ? `\n\nError Message / Stack Trace:\n\`\`\`\n${req.errorMessage}\n\`\`\``
    : "";

  const typeInstructions: Record<string, string> = {
    error: "Focus on finding and fixing bugs and errors.",
    security: "Focus on identifying and fixing security vulnerabilities (OWASP, CWE).",
    performance: "Focus on identifying and fixing performance bottlenecks.",
    all: "Perform a comprehensive analysis: bugs, security, and performance.",
  };

  return `You are CodeMedic AI — an expert code analysis engine. Analyze the code below and return ONLY valid JSON matching the exact schema. No markdown, no text outside the JSON object.

${langHint}
Analysis focus: ${typeInstructions[req.analysisType]}
${req.fileName ? `File: ${req.fileName}` : ""}

Code to analyze:
\`\`\`
${req.code}
\`\`\`
${errorSection}

Return ONLY this JSON (no extra text before or after):
{
  "language": "<typescript|javascript|python|rust|go|java|cpp|csharp|php|ruby|swift|kotlin|unknown>",
  "explanation": "<2-4 sentence explanation of what the code does and what problems were found>",
  "rootCause": "<1-2 sentence precise root cause of the primary issue>",
  "fixedCode": "<complete corrected and runnable code>",
  "diff": [{ "type": "added"|"removed"|"unchanged", "content": "<line>", "lineNumber": <number> }],
  "errors": [{ "line": <number|null>, "column": <number|null>, "message": "<description>", "type": "<ErrorType>" }],
  "securityIssues": [{ "id": "SEC-001", "title": "<title>", "severity": "critical"|"high"|"medium"|"low"|"info", "description": "<description>", "line": <number|null>, "recommendation": "<fix>", "cweId": "<CWE-XXX|null>" }],
  "performanceIssues": [{ "id": "PERF-001", "title": "<title>", "impact": "high"|"medium"|"low", "description": "<description>", "line": <number|null>, "recommendation": "<fix>", "estimatedGain": "<gain|null>" }],
  "confidence": <0.0-1.0>
}`;
}

export async function analyzeCode(req: AnalyzeRequest): Promise<AnalysisResult> {
  if (!process.env.GROQ_API_KEY) {
    await new Promise((r) => setTimeout(r, 1800));
    return getMockResult(req);
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = buildAnalysisPrompt(req);

  const completion = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "You are a code analysis engine. Always respond with valid JSON only. Never include markdown fences or any text outside the JSON object.",
      },
      { role: "user", content: prompt },
    ],
  });

  let raw = completion.choices[0]?.message?.content?.trim() ?? "";

  // Strip accidental markdown fences
  raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: Omit<AnalysisResult, "id" | "analysisType" | "createdAt">;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  return {
    id: crypto.randomUUID(),
    analysisType: req.analysisType,
    createdAt: new Date().toISOString(),
    language: (parsed.language ?? req.language ?? "unknown") as Language,
    explanation: parsed.explanation ?? "",
    rootCause: parsed.rootCause ?? "",
    fixedCode: parsed.fixedCode ?? req.code,
    diff: parsed.diff ?? [],
    errors: parsed.errors ?? [],
    securityIssues: parsed.securityIssues ?? [],
    performanceIssues: parsed.performanceIssues ?? [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
  };
}
