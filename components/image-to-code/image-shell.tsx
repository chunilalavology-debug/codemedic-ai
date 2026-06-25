"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Copy,
  Check,
  Download,
  X,
  Code2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ImageToCodeResult, UIFramework, CodeMode } from "@/types";

const frameworks: { id: UIFramework; label: string; ext: string }[] = [
  { id: "react", label: "React", ext: ".tsx" },
  { id: "nextjs", label: "Next.js", ext: ".tsx" },
  { id: "html", label: "HTML/CSS", ext: ".html" },
  { id: "vue", label: "Vue", ext: ".vue" },
  { id: "tailwind", label: "Tailwind", ext: ".html" },
];

const langMap: Record<UIFramework, string> = {
  react: "tsx",
  nextjs: "tsx",
  html: "html",
  vue: "html",
  tailwind: "html",
};

export function ImageShell() {
  const [framework, setFramework] = useState<UIFramework>("react");
  const [mode, setMode] = useState<CodeMode>("component");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImageToCodeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImage(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleGenerate = useCallback(async () => {
    if (!image) { toast.error("Please upload an image first"); return; }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("framework", framework);
      fd.append("mode", mode);

      const res = await fetch("/api/image-to-code", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Generation failed");
      setResult(data.data);
      toast.success("Code generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsLoading(false);
    }
  }, [image, framework, mode]);

  const copyCode = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied!");
  }, [result]);

  const downloadCode = useCallback(() => {
    if (!result) return;
    const ext = frameworks.find((f) => f.id === result.framework)?.ext ?? ".txt";
    const blob = new Blob([result.code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `component${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded!");
  }, [result]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Image → Code Generator</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a UI screenshot and get production-ready code powered by Groq Vision AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload + Options */}
        <div className="space-y-4">
          {/* Drop zone */}
          <Card
            className={cn(
              "border-2 border-dashed transition-colors cursor-pointer",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              {preview ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <button
                    className="absolute top-0 right-0 rounded-full bg-background border border-border p-0.5 shadow-sm"
                    onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); setResult(null); }}
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">{image?.name}</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <ImageIcon className="size-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">Drop image here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 5MB</p>
                </>
              )}
            </CardContent>
          </Card>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* Framework */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Framework</p>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setFramework(f.id); setResult(null); }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      framework === f.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Mode</p>
              <div className="flex gap-2">
                {(["component", "page"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setResult(null); }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                      mode === m
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!image || isLoading}
            className="w-full gradient-primary text-white border-0"
          >
            {isLoading ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="size-4 mr-2" />Generate Code</>
            )}
          </Button>
        </div>

        {/* Right: Result */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-3"
              >
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Analyzing image and generating code…
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Explanation */}
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    {result.components.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {result.components.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Code */}
                <Card className="overflow-hidden">
                  <CardHeader className="p-3 border-b border-border flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Code2 className="size-4" />
                      {frameworks.find((f) => f.id === result.framework)?.label} Code
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={downloadCode}>
                        <Download className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyCode}>
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="max-h-96 overflow-auto text-xs">
                    <SyntaxHighlighter
                      language={langMap[result.framework]}
                      style={oneDark}
                      customStyle={{ margin: 0, borderRadius: 0, fontSize: "11px" }}
                      wrapLongLines
                    >
                      {result.code}
                    </SyntaxHighlighter>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 gap-2 border-2 border-dashed border-border rounded-xl"
              >
                <Upload className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Generated code will appear here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
