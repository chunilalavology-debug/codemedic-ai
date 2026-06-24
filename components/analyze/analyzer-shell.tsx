"use client";

import { useState, useRef, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Copy, Check, Bug, Shield, Zap, Layers,
  AlertTriangle, Info, X, FileCode, Loader2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnalysisResult, AnalysisType, Language } from "@/types";

const LANGUAGES: { value: string; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const ANALYSIS_TYPES: {
  value: AnalysisType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "all", label: "Full Scan", icon: Layers },
  { value: "error", label: "Errors", icon: Bug },
  { value: "security", label: "Security", icon: Shield },
  { value: "performance", label: "Performance", icon: Zap },
];

const SYNTAX_LANG_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  rust: "rust",
  go: "go",
  java: "java",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  unknown: "text",
};

const SEVERITY_CLASSES: Record<string, string> = {
  critical: "border-red-300 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
  high: "border-orange-300 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
  medium: "border-yellow-300 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300",
  low: "border-blue-300 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  info: "border-slate-300 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300",
};

const IMPACT_CLASSES: Record<string, string> = {
  high: "border-red-300 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
  medium: "border-yellow-300 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300",
  low: "border-green-300 dark:border-green-800/50 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
};

export function AnalyzerShell() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("auto");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("all");
  const [fileName, setFileName] = useState("");
  const [showErrorInput, setShowErrorInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("issues");
  const [copied, setCopied] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCode(ev.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error("Please paste or upload some code first.");
      return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          errorMessage: errorMessage.trim() || undefined,
          language: language === "auto" ? undefined : (language as Language),
          analysisType,
          fileName: fileName || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data as AnalysisResult);
      setActiveTab("issues");
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.fixedCode);
    setCopied(true);
    toast.success("Fixed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const totalIssues = result
    ? result.errors.length + result.securityIssues.length + result.performanceIssues.length
    : 0;

  return (
    <div className="space-y-5">
      {/* ── Input Panel ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          {/* Language select */}
          <Select value={language} onValueChange={(v) => { if (v) setLanguage(v); }}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Analysis type pills */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            {ANALYSIS_TYPES.map((t) => {
              const Icon = t.icon;
              const active = analysisType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setAnalysisType(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {fileName && (
              <Badge variant="secondary" className="gap-1">
                <FileCode className="size-3" />
                <span className="max-w-32 truncate">{fileName}</span>
                <button
                  onClick={() => { setFileName(""); setCode(""); }}
                  className="ml-0.5 hover:text-destructive transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".ts,.tsx,.js,.jsx,.mjs,.py,.rs,.go,.java,.cpp,.cc,.cs,.php,.rb,.swift,.kt,.txt"
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5 mr-1" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Code input */}
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here…"
          className="min-h-56 rounded-none border-0 border-b border-border font-mono text-sm resize-none focus-visible:ring-0 bg-transparent leading-relaxed"
          spellCheck={false}
        />

        {/* Optional error/stack trace */}
        <div className={cn("border-b border-border", showErrorInput && "bg-muted/10")}>
          <button
            onClick={() => setShowErrorInput((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <AlertTriangle className="size-3.5 text-yellow-500" />
            Add error message or stack trace
            <span className="text-[10px] text-muted-foreground/60 ml-1">(optional)</span>
            <ChevronDown
              className={cn("ml-auto size-3.5 transition-transform duration-200", showErrorInput && "rotate-180")}
            />
          </button>
          {showErrorInput && (
            <Textarea
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="TypeError: Cannot read properties of undefined (reading 'map')…"
              className="min-h-20 rounded-none border-0 font-mono text-xs resize-none focus-visible:ring-0 bg-transparent px-4"
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {code
              ? `${code.split("\n").length} lines · ${code.length.toLocaleString()} chars`
              : "No code loaded"}
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !code.trim()}
            className="gradient-primary text-white border-0 gap-2 h-9"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Play className="size-4" />
                Analyze Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-12">
          <div className="relative">
            <div className="size-12 rounded-full border-2 border-primary/20 animate-pulse" />
            <Loader2 className="size-6 text-primary animate-spin absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-medium text-foreground">Analyzing your code…</p>
          <p className="text-xs text-muted-foreground">Llama 3.3 70B is reviewing for issues</p>
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Result meta bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
              <Badge className="capitalize bg-primary/10 text-primary border-primary/20 font-mono">
                {result.language}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs">
                {result.analysisType === "all" ? "Full Scan" : result.analysisType}
              </Badge>
              {totalIssues > 0 ? (
                <Badge className="bg-red-500/10 text-red-500 border-red-300 dark:border-red-800/40 text-xs">
                  {totalIssues} issue{totalIssues !== 1 ? "s" : ""} found
                </Badge>
              ) : (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-800/40 text-xs">
                  No issues
                </Badge>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <Progress value={result.confidence * 100} className="w-20 h-1.5" />
                <span className="text-xs font-medium tabular-nums">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Explanation + Root Cause */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="size-4 text-blue-400 shrink-0" />
                  <h3 className="text-sm font-semibold">Explanation</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Bug className="size-4 text-red-400 shrink-0" />
                  <h3 className="text-sm font-semibold">Root Cause</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.rootCause}</p>
              </div>
            </div>

            {/* Tabbed detail panel */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border px-4">
                  <TabsList variant="line" className="h-11 gap-1">
                    <TabsTrigger value="issues" className="gap-1.5">
                      Issues
                      {totalIssues > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 leading-none">
                          {totalIssues}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="fixed">Fixed Code</TabsTrigger>
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                  </TabsList>
                </div>

                {/* ── Issues tab ── */}
                <TabsContent value="issues" className="p-4 space-y-5">
                  {totalIssues === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="size-6 text-green-500" />
                      </div>
                      <p className="font-medium">No issues found</p>
                      <p className="text-sm text-muted-foreground">Your code looks clean!</p>
                    </div>
                  ) : (
                    <>
                      {/* Errors */}
                      {result.errors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Errors ({result.errors.length})
                          </h4>
                          {result.errors.map((err, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-3"
                            >
                              <div className="flex items-start gap-2.5">
                                <Bug className="size-4 text-red-500 mt-0.5 shrink-0" />
                                <div className="space-y-1 min-w-0">
                                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    {err.type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{err.message}</p>
                                  {(err.line != null || err.column != null) && (
                                    <p className="text-[11px] text-muted-foreground/70 font-mono">
                                      {err.line != null ? `Line ${err.line}` : ""}
                                      {err.column != null ? `, Col ${err.column}` : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Security */}
                      {result.securityIssues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Security ({result.securityIssues.length})
                          </h4>
                          {result.securityIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className={cn("rounded-lg border p-3 space-y-1.5", SEVERITY_CLASSES[issue.severity] ?? SEVERITY_CLASSES.info)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Shield className="size-4 shrink-0" />
                                  <span className="text-sm font-medium truncate">{issue.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge className={cn("text-[10px] capitalize", SEVERITY_CLASSES[issue.severity])}>
                                    {issue.severity}
                                  </Badge>
                                  {issue.cweId && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {issue.cweId}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs opacity-80">{issue.description}</p>
                              <p className="text-xs opacity-60 italic">
                                Fix: {issue.recommendation}
                              </p>
                              {issue.line != null && (
                                <p className="text-[11px] font-mono opacity-50">Line {issue.line}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Performance */}
                      {result.performanceIssues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Performance ({result.performanceIssues.length})
                          </h4>
                          {result.performanceIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className={cn("rounded-lg border p-3 space-y-1.5", IMPACT_CLASSES[issue.impact] ?? IMPACT_CLASSES.low)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Zap className="size-4 shrink-0" />
                                  <span className="text-sm font-medium truncate">{issue.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge className={cn("text-[10px] capitalize", IMPACT_CLASSES[issue.impact])}>
                                    {issue.impact} impact
                                  </Badge>
                                  {issue.estimatedGain && (
                                    <Badge variant="outline" className="text-[10px] text-green-600 dark:text-green-400 border-green-300 dark:border-green-800/50">
                                      {issue.estimatedGain}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs opacity-80">{issue.description}</p>
                              <p className="text-xs opacity-60 italic">
                                Fix: {issue.recommendation}
                              </p>
                              {issue.line != null && (
                                <p className="text-[11px] font-mono opacity-50">Line {issue.line}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* ── Fixed Code tab ── */}
                <TabsContent value="fixed" className="relative">
                  <button
                    onClick={handleCopy}
                    className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <div className="overflow-auto max-h-[480px]">
                    <SyntaxHighlighter
                      language={SYNTAX_LANG_MAP[result.language] ?? "text"}
                      style={oneDark}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: "0.78rem",
                        lineHeight: "1.6",
                        background: "oklch(0.12 0.015 22)",
                      }}
                      lineNumberStyle={{
                        color: "rgba(255,255,255,0.2)",
                        minWidth: "2.8em",
                        paddingRight: "1em",
                        userSelect: "none",
                      }}
                    >
                      {result.fixedCode}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>

                {/* ── Diff tab ── */}
                <TabsContent value="diff" className="p-4">
                  {result.diff.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No diff available for this analysis.
                    </p>
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-border font-mono text-xs leading-6">
                      {result.diff.map((line, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex gap-3 px-4 py-0",
                            line.type === "added" &&
                              "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
                            line.type === "removed" &&
                              "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
                            line.type === "unchanged" && "text-muted-foreground"
                          )}
                        >
                          <span className="select-none w-8 text-right opacity-40 shrink-0">
                            {line.lineNumber}
                          </span>
                          <span className="select-none w-4 font-bold opacity-60 shrink-0">
                            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
