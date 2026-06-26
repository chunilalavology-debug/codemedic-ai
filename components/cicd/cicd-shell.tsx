"use client";

import { useState } from "react";
import { GitBranch, Loader2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CicdCheckResult } from "@/lib/cicd-checker";

export function CicdShell() {
  const [filename, setFilename] = useState(".github/workflows/ci.yml");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CicdCheckResult | null>(null);

  async function check() {
    if (!content.trim()) {
      toast.error("Paste a pipeline YAML file first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cicd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [{ name: filename, content }] }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string);
    reader.readAsText(file);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">CI/CD Pipeline Checker</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Validate GitHub Actions, GitLab CI, CircleCI, and Azure Pipelines configs.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Filename</Label>
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pipeline YAML</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-48 font-mono text-xs"
              placeholder="Paste .github/workflows/ci.yml content…"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={check} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <GitBranch className="size-4" />}
              Check pipeline
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
              <Upload className="size-4" /> Upload file
              <input type="file" accept=".yml,.yaml" className="hidden" onChange={onFile} />
            </label>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{result.provider} — Health Score</span>
              <Badge>{result.score}/100</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={result.score} className="h-2" />
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            <ul className="space-y-2">
              {result.issues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-lg border border-border p-3 text-sm flex gap-2"
                >
                  {issue.severity === "error" ? (
                    <AlertTriangle className="size-4 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 text-yellow-500 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{issue.description}</p>
                    {issue.line && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {issue.file}:{issue.line}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
