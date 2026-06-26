"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Copy, Check, Bug, Shield, Zap, Layers,
  AlertTriangle, Info, X, FileCode, Loader2, ChevronDown,
  Sparkles, GitCompare, ArrowDownToLine, MessageSquarePlus,
  Wand2, Code2,
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
import { parseEditorContent } from "@/lib/analyze-content";
import {
  ANALYZER_LANGUAGES,
  FILE_ACCEPT,
  SYNTAX_LANG_MAP,
} from "@/lib/language-config";
import { CodeEditor } from "@/components/analyze/code-editor";
import type {
  AnalysisResult,
  AnalysisType,
  AnalyzeFollowUpMessage,
  Language,
} from "@/types";

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

function countIssues(result: AnalysisResult) {
  return (
    result.errors.length +
    result.securityIssues.length +
    result.performanceIssues.length +
    (result.codeSmells?.length ?? 0)
  );
}

export function AnalyzerShell() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [editorContent, setEditorContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("auto");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("all");
  const [fileName, setFileName] = useState("");
  const [showErrorInput, setShowErrorInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [originalCode, setOriginalCode] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");
  const [conversation, setConversation] = useState<AnalyzeFollowUpMessage[]>([]);

  const editorLang = language === "auto" ? "typescript" : language;

  const stats = useMemo(() => {
    const lines = editorContent ? editorContent.split("\n").length : 0;
    return { lines, chars: editorContent.length };
  }, [editorContent]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditorContent(ev.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const runAnalysis = async (opts?: {
    followUp?: string;
    appendConversation?: boolean;
  }) => {
    const { code, instructions } = parseEditorContent(editorContent);
    const contentToAnalyze = code || editorContent;

    if (!contentToAnalyze.trim() && !opts?.followUp) {
      toast.error("Paste code or describe what you want analyzed.");
      return;
    }

    setIsLoading(true);
    if (!opts?.followUp) {
      setResult(null);
      setOriginalCode(contentToAnalyze);
      setConversation([]);
    }

    const newMessages: AnalyzeFollowUpMessage[] = opts?.followUp
      ? [
          ...conversation,
          { role: "user", content: opts.followUp },
        ]
      : [];

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: contentToAnalyze,
          userInstructions: instructions,
          errorMessage: errorMessage.trim() || undefined,
          language: language === "auto" ? undefined : (language as Language),
          analysisType,
          fileName: fileName || undefined,
          followUpMessages: newMessages.length > 0 ? newMessages : undefined,
          previousFixedCode: opts?.followUp ? result?.fixedCode : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const data = json.data as AnalysisResult;
      setResult(data);
      setActiveTab("summary");

      if (opts?.followUp) {
        setConversation([
          ...newMessages,
          {
            role: "assistant",
            content: data.explanation,
          },
        ]);
        setFollowUpInput("");
      }

      toast.success(opts?.followUp ? "Follow-up applied!" : "Analysis complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => runAnalysis();
  const handleFollowUp = () => {
    if (!followUpInput.trim()) return;
    runAnalysis({ followUp: followUpInput.trim(), appendConversation: true });
  };

  const handleCopy = async (text?: string) => {
    const content = text ?? result?.fixedCode;
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyChanges = () => {
    if (!result?.fixedCode) return;
    setEditorContent(result.fixedCode);
    toast.success("Fixed code applied to editor");
  };

  const totalIssues = result ? countIssues(result) : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 0%, oklch(0.58 0.22 38 / 0.15), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.5 0.24 22 / 0.12), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg gradient-primary text-white shadow-sm">
                <Code2 className="size-4" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">AI Code Analyzer</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Paste code with natural-language instructions — fix bugs, optimize performance, audit security, or refine Shopify Liquid themes.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-0">
            {["Liquid", "React", "Python", "PHP", "JSON"].map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Editor panel */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
          <Select value={language} onValueChange={(v) => { if (v) setLanguage(v); }}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYZER_LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                      ? "gradient-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {fileName && (
              <Badge variant="secondary" className="gap-1 max-w-[140px]">
                <FileCode className="size-3 shrink-0" />
                <span className="truncate">{fileName}</span>
                <button
                  onClick={() => { setFileName(""); setEditorContent(""); }}
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
              accept={FILE_ACCEPT}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5 mr-1" />
              Upload
            </Button>
          </div>
        </div>

        <div className="border-b border-border bg-background/50">
          <CodeEditor
            value={editorContent}
            onChange={setEditorContent}
            language={editorLang}
          />
        </div>

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
              className="min-h-20 rounded-none border-0 font-mono text-xs resize-none focus-visible:ring-0 bg-transparent px-4 pb-3"
              spellCheck={false}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-muted/10">
          <p className="text-xs text-muted-foreground tabular-nums">
            {stats.lines > 0
              ? `${stats.lines} lines · ${stats.chars.toLocaleString()} chars`
              : "Ready — paste code and describe your goal"}
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !editorContent.trim()}
            className="gradient-primary text-white border-0 gap-2 h-9 shadow-md shadow-primary/15 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analyze Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!result && !isLoading && !editorContent.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center"
        >
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wand2 className="size-7 text-primary" />
          </div>
          <p className="font-medium">Start your analysis</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Paste code and add instructions like &quot;Fix responsive issues&quot;, &quot;Add authentication&quot;, or &quot;Optimize this Shopify section&quot;.
          </p>
        </motion.div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card py-14"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 gradient-primary animate-pulse" />
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="size-14 rounded-full border-2 border-primary/20" />
                <Loader2 className="size-7 text-primary animate-spin absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Scanning your code…</p>
                <p className="text-xs text-muted-foreground">
                  Checking bugs, security, performance, and code quality
                </p>
              </div>
              <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/3 gradient-primary animate-pulse rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Meta + actions */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="h-0.5 gradient-primary" />
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
                <Badge className="capitalize bg-primary/10 text-primary border-primary/20 font-mono">
                  {result.language}
                </Badge>
                <Badge variant="outline" className="capitalize text-xs">
                  {result.analysisType === "all" ? "Full Scan" : result.analysisType}
                </Badge>
                {totalIssues > 0 ? (
                  <Badge className="bg-red-500/10 text-red-500 border-red-300 dark:border-red-800/40 text-xs">
                    {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-800/40 text-xs">
                    Clean
                  </Badge>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {result.qualityScore != null && (
                    <>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Quality</span>
                      <Progress value={result.qualityScore} className="w-14 h-1.5" />
                      <span className="text-xs font-medium tabular-nums">{result.qualityScore}%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/5">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setActiveTab("summary")}>
                  <Info className="size-3.5" />
                  Issue Summary
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setActiveTab("fixed")}>
                  <Code2 className="size-3.5" />
                  Fixed Code
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setActiveTab("summary")}>
                  <Sparkles className="size-3.5" />
                  Explain Changes
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleApplyChanges}>
                  <ArrowDownToLine className="size-3.5" />
                  Apply Changes
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => handleCopy()}>
                  {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                  Copy Code
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setActiveTab("compare")}>
                  <GitCompare className="size-3.5" />
                  Compare
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border px-4 overflow-x-auto">
                  <TabsList variant="line" className="h-11 gap-1 min-w-max">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="issues">
                      Issues
                      {totalIssues > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 leading-none ml-1">
                          {totalIssues}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="fixed">Fixed Code</TabsTrigger>
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                    {result.optimizedCode && (
                      <TabsTrigger value="optimized">Optimized</TabsTrigger>
                    )}
                    <TabsTrigger value="compare">Compare</TabsTrigger>
                  </TabsList>
                </div>

                {/* Summary tab */}
                <TabsContent value="summary" className="p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-blue-400 shrink-0" />
                        <h3 className="text-sm font-semibold">Explanation</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Bug className="size-4 text-red-400 shrink-0" />
                        <h3 className="text-sm font-semibold">Root Cause</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.rootCause}</p>
                    </div>
                  </div>

                  {result.improvements && result.improvements.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/5 p-4 space-y-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />
                        Suggested Improvements
                      </h3>
                      <ul className="space-y-1.5">
                        {result.improvements.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary font-bold shrink-0">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Issues tab */}
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
                      {result.errors.length > 0 && (
                        <IssueSection title={`Errors (${result.errors.length})`}>
                          {result.errors.map((err, i) => (
                            <div key={i} className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-3">
                              <div className="flex items-start gap-2.5">
                                <Bug className="size-4 text-red-500 mt-0.5 shrink-0" />
                                <div className="space-y-1 min-w-0">
                                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{err.type}</p>
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
                        </IssueSection>
                      )}

                      {(result.codeSmells?.length ?? 0) > 0 && (
                        <IssueSection title={`Code Smells (${result.codeSmells!.length})`}>
                          {result.codeSmells!.map((smell) => (
                            <div key={smell.id} className={cn("rounded-lg border p-3 space-y-1.5", SEVERITY_CLASSES.medium)}>
                              <p className="text-sm font-medium">{smell.title}</p>
                              <p className="text-xs opacity-80">{smell.description}</p>
                              <p className="text-xs opacity-60 italic">Fix: {smell.recommendation}</p>
                            </div>
                          ))}
                        </IssueSection>
                      )}

                      {result.securityIssues.length > 0 && (
                        <IssueSection title={`Security (${result.securityIssues.length})`}>
                          {result.securityIssues.map((issue) => (
                            <div key={issue.id} className={cn("rounded-lg border p-3 space-y-1.5", SEVERITY_CLASSES[issue.severity] ?? SEVERITY_CLASSES.info)}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Shield className="size-4 shrink-0" />
                                  <span className="text-sm font-medium truncate">{issue.title}</span>
                                </div>
                                <Badge className={cn("text-[10px] capitalize shrink-0", SEVERITY_CLASSES[issue.severity])}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-xs opacity-80">{issue.description}</p>
                              <p className="text-xs opacity-60 italic">Fix: {issue.recommendation}</p>
                            </div>
                          ))}
                        </IssueSection>
                      )}

                      {result.performanceIssues.length > 0 && (
                        <IssueSection title={`Performance (${result.performanceIssues.length})`}>
                          {result.performanceIssues.map((issue) => (
                            <div key={issue.id} className={cn("rounded-lg border p-3 space-y-1.5", IMPACT_CLASSES[issue.impact] ?? IMPACT_CLASSES.low)}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Zap className="size-4 shrink-0" />
                                  <span className="text-sm font-medium truncate">{issue.title}</span>
                                </div>
                                <Badge className={cn("text-[10px] capitalize shrink-0", IMPACT_CLASSES[issue.impact])}>
                                  {issue.impact}
                                </Badge>
                              </div>
                              <p className="text-xs opacity-80">{issue.description}</p>
                              <p className="text-xs opacity-60 italic">Fix: {issue.recommendation}</p>
                            </div>
                          ))}
                        </IssueSection>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Fixed code */}
                <TabsContent value="fixed" className="relative">
                  <button
                    onClick={() => handleCopy()}
                    className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <div className="overflow-auto max-h-[520px]">
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
                    >
                      {result.fixedCode}
                    </SyntaxHighlighter>
                  </div>
                </TabsContent>

                {/* Diff */}
                <TabsContent value="diff" className="p-4">
                  {result.diff.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No diff available.</p>
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-border font-mono text-xs leading-6 max-h-[520px] overflow-y-auto">
                      {result.diff.map((line, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex gap-3 px-4 py-0",
                            line.type === "added" && "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
                            line.type === "removed" && "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
                            line.type === "unchanged" && "text-muted-foreground"
                          )}
                        >
                          <span className="select-none w-8 text-right opacity-40 shrink-0">{line.lineNumber}</span>
                          <span className="select-none w-4 font-bold opacity-60 shrink-0">
                            {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Optimized */}
                {result.optimizedCode && (
                  <TabsContent value="optimized" className="relative">
                    <button
                      onClick={() => handleCopy(result.optimizedCode)}
                      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-border bg-background/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </button>
                    <div className="overflow-auto max-h-[520px]">
                      <SyntaxHighlighter
                        language={SYNTAX_LANG_MAP[result.language] ?? "text"}
                        style={oneDark}
                        showLineNumbers
                        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.78rem", background: "oklch(0.12 0.015 22)" }}
                      >
                        {result.optimizedCode}
                      </SyntaxHighlighter>
                    </div>
                  </TabsContent>
                )}

                {/* Compare */}
                <TabsContent value="compare" className="p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-red-500/5 text-xs font-semibold text-red-600 dark:text-red-400">
                        Original
                      </div>
                      <div className="overflow-auto max-h-[400px]">
                        <SyntaxHighlighter
                          language={SYNTAX_LANG_MAP[result.language] ?? "text"}
                          style={oneDark}
                          showLineNumbers
                          customStyle={{ margin: 0, fontSize: "0.72rem", background: "oklch(0.12 0.015 22)" }}
                        >
                          {originalCode || editorContent}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="px-3 py-2 border-b border-border bg-green-500/5 text-xs font-semibold text-green-600 dark:text-green-400">
                        Updated
                      </div>
                      <div className="overflow-auto max-h-[400px]">
                        <SyntaxHighlighter
                          language={SYNTAX_LANG_MAP[result.language] ?? "text"}
                          style={oneDark}
                          showLineNumbers
                          customStyle={{ margin: 0, fontSize: "0.72rem", background: "oklch(0.12 0.015 22)" }}
                        >
                          {result.fixedCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Follow-up */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Follow-up prompt</h3>
                <span className="text-xs text-muted-foreground">— refine without losing context</span>
              </div>
              {conversation.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto rounded-lg bg-muted/20 p-3">
                  {conversation.map((msg, i) => (
                    <p key={i} className={cn("text-xs", msg.role === "user" ? "text-foreground font-medium" : "text-muted-foreground")}>
                      <span className="capitalize opacity-60">{msg.role}: </span>
                      {msg.content.slice(0, 200)}{msg.content.length > 200 ? "…" : ""}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder='e.g. "Also add error handling" or "Make it work with Shopify 2.0 sections"'
                  className="min-h-[44px] resize-none text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleFollowUp();
                    }
                  }}
                />
                <Button
                  onClick={handleFollowUp}
                  disabled={isLoading || !followUpInput.trim()}
                  className="gradient-primary text-white border-0 shrink-0 h-11 sm:h-auto"
                >
                  <Play className="size-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IssueSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
