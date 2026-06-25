"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApiTestResult, HttpMethod } from "@/types";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const methodColors: Record<HttpMethod, string> = {
  GET: "text-green-600 bg-green-500/10",
  POST: "text-blue-600 bg-blue-500/10",
  PUT: "text-yellow-600 bg-yellow-500/10",
  PATCH: "text-orange-600 bg-orange-500/10",
  DELETE: "text-red-600 bg-red-500/10",
  HEAD: "text-purple-600 bg-purple-500/10",
  OPTIONS: "text-gray-600 bg-gray-500/10",
};

const statusColor = (status: number) => {
  if (status >= 500) return "text-red-600 bg-red-500/10";
  if (status >= 400) return "text-orange-600 bg-orange-500/10";
  if (status >= 300) return "text-yellow-600 bg-yellow-500/10";
  if (status >= 200) return "text-green-600 bg-green-500/10";
  return "text-muted-foreground bg-muted";
};

type CodeTab = "curl" | "fetch" | "axios";

export function InspectorShell() {
  const [url, setUrl] = useState("https://api.github.com/repos/vercel/next.js");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([{ key: "Accept", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [authType, setAuthType] = useState<"none" | "bearer" | "basic">("none");
  const [authValue, setAuthValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [codeTab, setCodeTab] = useState<CodeTab>("curl");
  const [showHeaders, setShowHeaders] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [bodyPretty, setBodyPretty] = useState(false);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  }, []);

  const handleSend = useCallback(async () => {
    if (!url.trim()) { toast.error("Please enter a URL"); return; }
    setIsLoading(true);
    try {
      const headerMap: Record<string, string> = {};
      for (const { key, value } of headers) {
        if (key.trim()) headerMap[key.trim()] = value.trim();
      }
      const res = await fetch("/api/test-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), method, headers: headerMap, body: body || undefined, auth: authType !== "none" ? { type: authType, value: authValue } : undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Request failed");
      setResult(data.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headers, body, authType, authValue]);

  const prettyBody = useCallback((raw: string) => {
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">API Inspector</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send HTTP requests, inspect responses, detect issues, and generate code snippets.
        </p>
      </div>

      {/* Request builder */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* URL bar */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className={cn(
                "rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring",
                methodColors[method]
              )}
            >
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="https://api.example.com/endpoint"
              className="font-mono text-sm flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="gradient-primary text-white border-0 px-6"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <><Zap className="size-4 mr-2" />Send</>}
            </Button>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-xs text-muted-foreground shrink-0">Auth:</Label>
            {(["none", "bearer", "basic"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAuthType(a)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  authType === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {a === "none" ? "No Auth" : a === "bearer" ? "Bearer Token" : "Basic Auth"}
              </button>
            ))}
            {authType !== "none" && (
              <Input
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                placeholder={authType === "bearer" ? "Token…" : "user:password"}
                className="flex-1 min-w-40 text-sm font-mono"
                type="password"
              />
            )}
          </div>

          {/* Headers toggle */}
          <button
            onClick={() => setShowHeaders((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showHeaders ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            Headers ({headers.filter((h) => h.key.trim()).length})
          </button>

          <AnimatePresence>
            {showHeaders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2"
              >
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={h.key}
                      onChange={(e) => setHeaders((prev) => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                      placeholder="Key"
                      className="text-sm"
                    />
                    <Input
                      value={h.value}
                      onChange={(e) => setHeaders((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      placeholder="Value"
                      className="text-sm"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setHeaders((prev) => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setHeaders((prev) => [...prev, { key: "", value: "" }])}>
                  <Plus className="size-3.5 mr-1" /> Add Header
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          {!["GET", "HEAD", "OPTIONS"].includes(method) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Request Body</Label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-28 rounded-lg border border-input bg-background p-3 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center flex-wrap gap-3">
                  <Badge className={cn("text-sm font-mono", statusColor(result.status))}>
                    {result.status} {result.statusText}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className={result.latency > 1000 ? "text-orange-600 font-semibold" : ""}>{result.latency}ms</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Database className="size-3.5" />
                    {result.size < 1024 ? `${result.size} B` : `${(result.size / 1024).toFixed(1)} KB`}
                  </div>
                  {result.success ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200">
                      <CheckCircle2 className="size-3 mr-1" /> Success
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-red-200">
                      <AlertTriangle className="size-3 mr-1" /> Failed
                    </Badge>
                  )}
                </div>

                {/* Issues */}
                {result.issues.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {result.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response body */}
            <Card className="overflow-hidden">
              <CardHeader className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Response Body</CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBodyPretty((v) => !v)}
                      className={cn("text-xs px-2 py-1 rounded", bodyPretty ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                    >
                      Pretty
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => copyText(bodyPretty ? prettyBody(result.responseBody) : result.responseBody, "body")}>
                      {copied === "body" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <pre className="p-4 text-xs font-mono overflow-auto max-h-80 bg-muted/20 text-foreground whitespace-pre-wrap break-words">
                {bodyPretty ? prettyBody(result.responseBody) : result.responseBody}
              </pre>
            </Card>

            {/* Response headers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response Headers ({Object.keys(result.responseHeaders).length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border max-h-48 overflow-auto">
                  {Object.entries(result.responseHeaders).map(([k, v]) => (
                    <div key={k} className="flex gap-3 px-4 py-1.5 text-xs font-mono">
                      <span className="text-muted-foreground shrink-0 w-44 truncate">{k}</span>
                      <span className="text-foreground truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code snippets */}
            <Card className="overflow-hidden">
              <CardHeader className="p-0 border-b border-border">
                <div className="flex">
                  {(["curl", "fetch", "axios"] as CodeTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCodeTab(t)}
                      className={cn(
                        "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
                        codeTab === t
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t === "curl" ? "cURL" : t === "fetch" ? "Fetch" : "Axios"}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center pr-3">
                    <Button variant="ghost" size="sm" onClick={() => copyText(codeTab === "curl" ? result.curlCommand : codeTab === "fetch" ? result.fetchCode : result.axiosCode, codeTab)}>
                      {copied === codeTab ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <pre className="p-4 text-xs font-mono overflow-auto max-h-48 bg-muted/20 whitespace-pre-wrap">
                {codeTab === "curl" ? result.curlCommand : codeTab === "fetch" ? result.fetchCode : result.axiosCode}
              </pre>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
