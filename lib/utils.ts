import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Language } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectLanguage(code: string, fileName?: string): Language {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const extMap: Record<string, Language> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      cpp: "cpp",
      cc: "cpp",
      cxx: "cpp",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
    };
    if (ext && ext in extMap) return extMap[ext];
  }

  if (/^(import|export|const|let|interface|type\s+\w+\s*=|:\s*(string|number|boolean|void))/.test(code)) {
    return "typescript";
  }
  if (/^(def |import |from .+ import|print\(|if __name__)/.test(code)) return "python";
  if (/^(fn |use |pub |let mut |impl )/.test(code)) return "rust";
  if (/^(package |func |import \(|:= )/.test(code)) return "go";
  if (/^(public class|private |protected |@Override)/.test(code)) return "java";
  if (/<\?php/.test(code)) return "php";

  return "unknown";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function truncateCode(code: string, maxLines = 5): string {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;
  return lines.slice(0, maxLines).join("\n") + `\n... (${lines.length - maxLines} more lines)`;
}

export function extractTitle(code: string, fileName?: string): string {
  if (fileName) return fileName;
  const functionMatch = code.match(/(?:function|def|fn|func)\s+(\w+)/);
  if (functionMatch) return functionMatch[1];
  const classMatch = code.match(/(?:class|interface)\s+(\w+)/);
  if (classMatch) return classMatch[1];
  return "Untitled Analysis";
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: "text-red-400 bg-red-950/50 border-red-800/50",
    high: "text-orange-400 bg-orange-950/50 border-orange-800/50",
    medium: "text-yellow-400 bg-yellow-950/50 border-yellow-800/50",
    low: "text-blue-400 bg-blue-950/50 border-blue-800/50",
    info: "text-slate-400 bg-slate-800/50 border-slate-700/50",
  };
  return map[severity] ?? map.info;
}

export function impactColor(impact: string): string {
  const map: Record<string, string> = {
    high: "text-red-400 bg-red-950/50 border-red-800/50",
    medium: "text-yellow-400 bg-yellow-950/50 border-yellow-800/50",
    low: "text-green-400 bg-green-950/50 border-green-800/50",
  };
  return map[impact] ?? map.low;
}
