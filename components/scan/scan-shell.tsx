"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  GitBranch,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Zap,
  Eye,
  Code2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ScanResult, ScanIssue, Severity } from "@/types";

type ScanMode = "website" | "github" | "gitlab";

const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const severityStyles: Record<Severity, string> = {
  critical: "bg-red-500/10 text-red-600 border-red-200",
  high: "bg-orange-500/10 text-orange-600 border-orange-200",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
  info: "bg-muted text-muted-foreground border-border",
};

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-600" : s >= 60 ? "text-yellow-600" : "text-red-600";

const scoreBarColor = (s: number) =>
  s >= 80 ? "bg-green-500" : s >= 60 ? "bg-yellow-500" : "bg-red-500";

export function ScanShell() {
  const [mode, setMode] = useState<ScanMode>("website");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to scan");
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), type: mode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Scan failed");
      setResult(data.data);
      toast.success("Scan complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsLoading(false);
    }
  }, [url, mode]);

  const copyReport = useCallback(() => {
    if (!result) return;
    const text = [
      `Scan Report: ${result.title}`,
      `URL: ${result.url}`,
      `Overall Score: ${result.scores.overall}/100`,
      "",
      "Scores:",
      ...Object.entries(result.scores)
        .filter(([k]) => k !== "overall")
        .map(([k, v]) => `  ${k}: ${v}/100`),
      "",
      "Summary:",
      result.summary,
      "",
      "Issues:",
      ...result.issues.map((i) => `  [${i.severity.toUpperCase()}] ${i.title}`),
      "",
      "Recommendations:",
      ...result.recommendations.map((r, i) => `  ${i + 1}. ${r}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Report copied!");
  }, [result]);

  const sortedIssues = result?.issues
    ? [...result.issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    : [];

  const criticalCount = sortedIssues.filter((i) => i.severity === "critical").length;
  const highCount = sortedIssues.filter((i) => i.severity === "high").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Website & Repository Scanner</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Detect SEO issues, security vulnerabilities, and code quality problems in any site or GitHub repo.
        </p>
      </div>

      {/* Mode selector + Input */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            {(["website", "github", "gitlab"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setUrl(""); }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {m === "website" ? <Globe className="size-4" /> : <GitBranch className="size-4" />}
                {m === "website" ? "Website URL" : "GitHub Repo"}
              </button>
            ))}
          </div>

          {/* URL input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              {mode === "website" ? (
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              ) : (
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              )}
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder={
                  mode === "website"
                    ? "https://example.com"
                    : "https://github.com/owner/repo"
                }
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={isLoading || !url.trim()}
              className="gradient-primary text-white border-0 px-6"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>

          {/* Loading state */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>
                    {mode === "website" ? "Fetching and analyzing page…" : "Fetching repository data…"}
                  </span>
                </div>
                <Progress value={null} className="h-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score overview */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{result.title}</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{result.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyReport}>
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span className="ml-1.5 text-xs">{copied ? "Copied" : "Copy Report"}</span>
                    </Button>
                    <div className="text-right">
                      <span className={cn("text-3xl font-bold", scoreColor(result.scores.overall))}>
                        {result.scores.overall}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </div>
                  </div>
                </div>

                {/* Score bars */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["Performance", result.scores.performance, Zap],
                      ["SEO", result.scores.seo, TrendingUp],
                      ["Accessibility", result.scores.accessibility, Eye],
                      ["Security", result.scores.security, Shield],
                      ["Maintainability", result.scores.maintainability, Code2],
                    ] as [string, number, React.ElementType][]
                  ).map(([label, score, Icon]) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className="size-3.5" />
                          {label}
                        </span>
                        <span className={cn("font-semibold", scoreColor(score))}>{score}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", scoreBarColor(score))}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  {result.summary}
                </div>

                {/* Issue counts */}
                {(criticalCount > 0 || highCount > 0) && (
                  <div className="mt-3 flex gap-2">
                    {criticalCount > 0 && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-200">
                        <AlertTriangle className="size-3 mr-1" />
                        {criticalCount} Critical
                      </Badge>
                    )}
                    {highCount > 0 && (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">
                        {highCount} High
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Issues list */}
            {sortedIssues.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Issues Found ({sortedIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {sortedIssues.map((issue) => (
                      <IssueRow
                        key={issue.id}
                        issue={issue}
                        expanded={expandedIssue === issue.id}
                        onToggle={() =>
                          setExpandedIssue((prev) =>
                            prev === issue.id ? null : issue.id
                          )
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Tech stack */}
            {result.techStack && result.techStack.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Tech Stack Detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.techStack.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IssueRow({
  issue,
  expanded,
  onToggle,
}: {
  issue: ScanIssue;
  expanded: boolean;
  onToggle: () => void;
}) {
  const categoryIcon: Record<string, React.ElementType> = {
    seo: TrendingUp,
    security: Shield,
    performance: Zap,
    accessibility: Eye,
    code: Code2,
    broken: AlertTriangle,
    dependency: Code2,
    responsive: Eye,
  };
  const Icon = categoryIcon[issue.category] ?? AlertTriangle;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <Icon className="size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{issue.title}</span>
          {issue.location && (
            <span className="ml-2 text-xs text-muted-foreground font-mono">{issue.location}</span>
          )}
        </div>
        <Badge className={cn("text-xs shrink-0", severityStyles[issue.severity])}>
          {issue.severity}
        </Badge>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="p-4 pl-10 space-y-2 bg-muted/20">
              <p className="text-sm text-muted-foreground">{issue.description}</p>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-green-500/5 border border-green-200/50">
                <CheckCircle2 className="size-3.5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700">{issue.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
