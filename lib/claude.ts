import Groq from "groq-sdk";
import type { AnalysisResult, AnalyzeRequest, Language } from "@/types";
import { detectLanguage } from "@/lib/utils";
import { DEFAULT_TEXT_MODEL, resolveTextModel } from "@/lib/ai-models";
import { computeQualityScore } from "@/lib/activity";
import { LANGUAGE_PROMPT_LIST } from "@/lib/language-config";

const MODEL = DEFAULT_TEXT_MODEL;

const LIQUID_GUIDANCE = `
For Shopify Liquid (.liquid) code, validate:
- Liquid tags ({% %}) and output tags ({{ }}) syntax
- Filters, objects, and theme variables (product, collection, cart, shop, etc.)
- Section/snippet structure and {% schema %} JSON blocks
- Theme performance (avoid nested loops, excessive all_products queries)
- Shopify Online Store 2.0 best practices (sections, blocks, app blocks)
- Accessibility in theme markup and responsive layout issues
Suggest corrected Liquid with valid tags, filters, and schema where applicable.`;

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
    optimizedCode: req.code.replace(/for\s*\(/g, "for (const item of "),
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
    codeSmells: [
      {
        id: "SMELL-001",
        title: "Long function",
        description: "Function exceeds recommended length and mixes multiple responsibilities.",
        line: 1,
        recommendation: "Extract validation, data fetching, and rendering into separate functions.",
      },
    ],
    improvements: [
      "Add input validation at function entry",
      "Use async/await instead of nested callbacks",
      "Add error boundaries for edge cases",
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
    qualityScore: 0,
  };
}

function buildAnalysisPrompt(req: AnalyzeRequest): string {
  const langHint =
    req.language && req.language !== "unknown"
      ? `Language: ${req.language}`
      : "Detect the language automatically (including Shopify Liquid, HTML, CSS, JS/TS, React/Next.js, Node.js, PHP, Python, Java, C++, JSON).";

  const errorSection = req.errorMessage
    ? `\n\nError Message / Stack Trace:\n\`\`\`\n${req.errorMessage}\n\`\`\``
    : "";

  const instructionsSection = req.userInstructions
    ? `\n\nUser instructions (apply these changes/fixes/improvements):\n${req.userInstructions}`
    : "";

  const followUpSection =
    req.followUpMessages && req.followUpMessages.length > 0
      ? `\n\nConversation history:\n${req.followUpMessages
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")}`
      : "";

  const previousFixSection = req.previousFixedCode
    ? `\n\nPrevious fixed version (refine based on follow-up):\n\`\`\`\n${req.previousFixedCode}\n\`\`\``
    : "";

  const typeInstructions: Record<string, string> = {
    error: "Focus on bugs, runtime errors, missing edge cases, and bad practices.",
    security: "Focus on security vulnerabilities (OWASP, CWE), injection, XSS, auth issues.",
    performance: "Focus on performance bottlenecks, inefficient algorithms, and memory issues.",
    all: "Comprehensive analysis: bugs, errors, security, performance, code smells, bad practices, and missing edge cases.",
  };

  const liquidNote = req.language === "liquid" || /{%|{{/.test(req.code) ? LIQUID_GUIDANCE : "";

  return `You are CodeMedic AI — an expert multi-language code analysis engine. Analyze the code below and return ONLY valid JSON matching the exact schema. No markdown, no text outside the JSON object.

${langHint}
Analysis focus: ${typeInstructions[req.analysisType]}
${req.fileName ? `File: ${req.fileName}` : ""}
${liquidNote}

Code to analyze:
\`\`\`
${req.code}
\`\`\`
${errorSection}${instructionsSection}${followUpSection}${previousFixSection}

Analyze for: bugs, errors, performance issues, security issues, bad practices, code smells, and missing edge cases.
If user instructions are provided, prioritize those changes in fixedCode.
For React/Next.js code, check hooks rules, SSR compatibility, and App Router patterns.

Return ONLY this JSON (no extra text before or after):
{
  "language": "<${LANGUAGE_PROMPT_LIST}>",
  "explanation": "<2-4 sentence explanation of what the code does and what problems were found>",
  "rootCause": "<1-2 sentence precise root cause of the primary issue>",
  "fixedCode": "<complete corrected code addressing all issues and user instructions>",
  "optimizedCode": "<optional performance-optimized version, or empty string if not applicable>",
  "diff": [{ "type": "added"|"removed"|"unchanged", "content": "<line>", "lineNumber": <number> }],
  "errors": [{ "line": <number|null>, "column": <number|null>, "message": "<description>", "type": "<ErrorType>" }],
  "codeSmells": [{ "id": "SMELL-001", "title": "<title>", "description": "<description>", "line": <number|null>, "recommendation": "<fix>" }],
  "securityIssues": [{ "id": "SEC-001", "title": "<title>", "severity": "critical"|"high"|"medium"|"low"|"info", "description": "<description>", "line": <number|null>, "recommendation": "<fix>", "cweId": "<CWE-XXX|null>" }],
  "performanceIssues": [{ "id": "PERF-001", "title": "<title>", "impact": "high"|"medium"|"low", "description": "<description>", "line": <number|null>, "recommendation": "<fix>", "estimatedGain": "<gain|null>" }],
  "improvements": ["<suggested improvement 1>", "<suggested improvement 2>"],
  "confidence": <0.0-1.0>
}`;
}

export async function analyzeCode(
  req: AnalyzeRequest,
  modelId?: string
): Promise<AnalysisResult> {
  const model = resolveTextModel(modelId);
  if (!process.env.GROQ_API_KEY) {
    await new Promise((r) => setTimeout(r, 1800));
    const mock = getMockResult(req);
    return { ...mock, qualityScore: computeQualityScore(mock) };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = buildAnalysisPrompt(req);

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model,
      max_tokens: 8192,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are a code analysis engine supporting many languages including Shopify Liquid. Always respond with valid JSON only. Never include markdown fences or any text outside the JSON object.",
        },
        { role: "user", content: prompt },
      ],
    });
  } catch (err) {
    if (model !== MODEL) {
      return analyzeCode(req, MODEL);
    }
    throw err;
  }

  let raw = completion.choices[0]?.message?.content?.trim() ?? "";

  raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: Omit<AnalysisResult, "id" | "analysisType" | "createdAt">;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  const result: AnalysisResult = {
    id: crypto.randomUUID(),
    analysisType: req.analysisType,
    createdAt: new Date().toISOString(),
    language: (parsed.language ?? req.language ?? detectLanguage(req.code, req.fileName) ?? "unknown") as Language,
    explanation: parsed.explanation ?? "",
    rootCause: parsed.rootCause ?? "",
    fixedCode: parsed.fixedCode ?? req.code,
    optimizedCode: parsed.optimizedCode || undefined,
    diff: parsed.diff ?? [],
    errors: parsed.errors ?? [],
    codeSmells: parsed.codeSmells ?? [],
    securityIssues: parsed.securityIssues ?? [],
    performanceIssues: parsed.performanceIssues ?? [],
    improvements: parsed.improvements ?? [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
    qualityScore: computeQualityScore({
      errors: parsed.errors,
      securityIssues: parsed.securityIssues,
      performanceIssues: parsed.performanceIssues,
      confidence: parsed.confidence,
    }),
  };

  return result;
}
