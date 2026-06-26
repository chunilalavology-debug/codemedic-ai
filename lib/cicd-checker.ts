export interface CicdIssue {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  file?: string;
  line?: number;
}

export interface CicdCheckResult {
  provider: string;
  files: string[];
  score: number;
  issues: CicdIssue[];
  summary: string;
}

const WORKFLOW_PATTERNS = [
  { provider: "GitHub Actions", pattern: /\.github\/workflows\/.+\.ya?ml$/i },
  { provider: "GitLab CI", pattern: /\.gitlab-ci\.ya?ml$/i },
  { provider: "CircleCI", pattern: /\.circleci\/config\.ya?ml$/i },
  { provider: "Azure Pipelines", pattern: /azure-pipelines\.ya?ml$/i },
  { provider: "Bitbucket Pipelines", pattern: /bitbucket-pipelines\.ya?ml$/i },
];

export function detectCicdFromPaths(paths: string[]): string[] {
  const found = new Set<string>();
  for (const path of paths) {
    for (const { provider, pattern } of WORKFLOW_PATTERNS) {
      if (pattern.test(path)) found.add(provider);
    }
  }
  return [...found];
}

export function analyzeCicdYaml(
  content: string,
  filename: string
): CicdCheckResult {
  const issues: CicdIssue[] = [];
  const lines = content.split("\n");
  const lower = filename.toLowerCase();

  let provider = "Generic CI/CD";
  if (lower.includes(".github/workflows")) provider = "GitHub Actions";
  else if (lower.includes("gitlab-ci")) provider = "GitLab CI";
  else if (lower.includes("circleci")) provider = "CircleCI";

  if (!content.trim()) {
    issues.push({
      id: "empty",
      severity: "error",
      title: "Empty pipeline file",
      description: "The CI/CD configuration file is empty.",
      file: filename,
    });
  }

  if (provider === "GitHub Actions" && !content.includes("runs-on:")) {
    issues.push({
      id: "gha-runs-on",
      severity: "warning",
      title: "Missing runs-on",
      description: "GitHub Actions workflows should specify runs-on for jobs.",
      file: filename,
    });
  }

  if (provider === "GitHub Actions" && content.includes("${{ secrets.") && !content.includes("permissions:")) {
    issues.push({
      id: "gha-permissions",
      severity: "info",
      title: "Consider explicit permissions",
      description: "Workflows using secrets should define minimal permissions block.",
      file: filename,
    });
  }

  lines.forEach((line, i) => {
    if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(line)) {
      issues.push({
        id: `secret-${i}`,
        severity: "error",
        title: "Hardcoded secret in pipeline",
        description: "Never commit passwords or tokens in CI files. Use secret variables.",
        file: filename,
        line: i + 1,
      });
    }
    if (/curl\s+.*\|\s*bash/i.test(line)) {
      issues.push({
        id: `curl-bash-${i}`,
        severity: "warning",
        title: "Pipe curl to bash",
        description: "Piping remote scripts to bash is a supply-chain risk.",
        file: filename,
        line: i + 1,
      });
    }
  });

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 25 - warnCount * 10);

  return {
    provider,
    files: [filename],
    score,
    issues,
    summary:
      issues.length === 0
        ? "Pipeline configuration looks healthy."
        : `Found ${issues.length} issue(s): ${errorCount} error(s), ${warnCount} warning(s).`,
  };
}

export function mergeCicdResults(results: CicdCheckResult[]): CicdCheckResult {
  if (results.length === 1) return results[0];
  const issues = results.flatMap((r) => r.issues);
  const files = results.flatMap((r) => r.files);
  const providers = [...new Set(results.map((r) => r.provider))].join(", ");
  const score = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  return {
    provider: providers,
    files,
    score,
    issues,
    summary: `Analyzed ${files.length} pipeline file(s). Average health score: ${score}/100.`,
  };
}
