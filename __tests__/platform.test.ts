import { describe, it, expect } from "vitest";
import { resolveTextModel, resolveVisionModel, TEXT_MODELS } from "@/lib/ai-models";
import { computeQualityScore } from "@/lib/activity";
import { analyzeCicdYaml, mergeCicdResults } from "@/lib/cicd-checker";
import { exportAsCsv, exportAsJson } from "@/lib/export";

describe("ai-models", () => {
  it("resolves valid text model", () => {
    expect(resolveTextModel(TEXT_MODELS[0].id)).toBe(TEXT_MODELS[0].id);
  });

  it("falls back for invalid model", () => {
    expect(resolveTextModel("invalid-model")).toBe(TEXT_MODELS[0].id);
  });

  it("resolves vision model", () => {
    expect(resolveVisionModel(null)).toBeTruthy();
  });
});

describe("activity quality score", () => {
  it("computes score from issues", () => {
    const score = computeQualityScore({
      confidence: 0.9,
      errors: [{}, {}],
      securityIssues: [{}],
      performanceIssues: [],
    });
    expect(score).toBeLessThan(90);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("cicd-checker", () => {
  it("flags empty pipeline", () => {
    const result = analyzeCicdYaml("", "ci.yml");
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("merges multiple results", () => {
    const a = analyzeCicdYaml("runs-on: ubuntu-latest\n", ".github/workflows/ci.yml");
    const b = analyzeCicdYaml("stages:\n  - build\n", ".gitlab-ci.yml");
    const merged = mergeCicdResults([a, b]);
    expect(merged.files.length).toBe(2);
  });
});

describe("export", () => {
  it("exports json and csv", () => {
    const payload = {
      title: "Test",
      type: "scan",
      generatedAt: new Date().toISOString(),
      data: { score: 80 },
    };
    expect(JSON.parse(exportAsJson(payload)).title).toBe("Test");
    expect(exportAsCsv(payload)).toContain("score");
  });
});
