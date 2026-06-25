"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug, Shield, Zap, Layers, Trash2, ChevronDown, Clock,
  BarChart2, AlertTriangle, Info, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AnalysisRecord } from "@/types";

interface HistoryShellProps {
  userId: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  error: Bug,
  security: Shield,
  performance: Zap,
};

const TYPE_COLORS: Record<string, string> = {
  all: "text-primary bg-primary/10 border-primary/20",
  error: "text-red-500 bg-red-500/10 border-red-300 dark:border-red-800/40",
  security: "text-orange-500 bg-orange-500/10 border-orange-300 dark:border-orange-800/40",
  performance: "text-yellow-500 bg-yellow-500/10 border-yellow-300 dark:border-yellow-800/40",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
  info: "bg-slate-500",
};

function HistoryCard({
  record,
  onDelete,
}: {
  record: AnalysisRecord;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const TypeIcon = TYPE_ICONS[record.analysisType] ?? Layers;
  const typeClass = TYPE_COLORS[record.analysisType] ?? TYPE_COLORS.all;
  const totalIssues =
    record.result.errors.length +
    record.result.securityIssues.length +
    record.result.performanceIssues.length;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/history?id=${record.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onDelete(record.id);
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(record.result.fixedCode);
    setCopied(true);
    toast.success("Fixed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Card header — always visible */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className={cn("p-1.5 rounded-lg border shrink-0 mt-0.5", typeClass)}>
          <TypeIcon className="size-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{record.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="text-[10px] font-mono capitalize bg-muted text-muted-foreground border-border">
              {record.language}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {formatRelativeTime(record.createdAt)}
            </span>
            {totalIssues > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-500">
                <AlertTriangle className="size-3" />
                {totalIssues} issue{totalIssues !== 1 ? "s" : ""}
              </span>
            )}
            {totalIssues === 0 && (
              <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                <Check className="size-3" />
                Clean
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mx-4 mb-3 h-0.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.round(record.result.confidence * 100)}%` }}
        />
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {record.result.errors.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Errors</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {record.result.securityIssues.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Security</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {record.result.performanceIssues.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Performance</p>
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Info className="size-3.5 text-blue-400" />
                  Explanation
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {record.result.explanation}
                </p>
              </div>

              {/* Security issues summary */}
              {record.result.securityIssues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Security Issues
                  </p>
                  {record.result.securityIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          SEVERITY_DOT[issue.severity] ?? SEVERITY_DOT.info
                        )}
                      />
                      <span className="font-medium capitalize">{issue.severity}</span>
                      <span className="text-muted-foreground truncate">— {issue.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Performance issues summary */}
              {record.result.performanceIssues.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Performance Issues
                  </p>
                  {record.result.performanceIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-2 text-xs">
                      <BarChart2 className="size-3 text-yellow-500 shrink-0" />
                      <span className="font-medium capitalize">{issue.impact} impact</span>
                      <span className="text-muted-foreground truncate">— {issue.title}</span>
                      {issue.estimatedGain && (
                        <Badge className="ml-auto text-[9px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/40">
                          {issue.estimatedGain}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Copy fixed code */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied!" : "Copy Fixed Code"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
          <Skeleton className="h-0.5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function HistoryShell({ userId }: HistoryShellProps) {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pageSize = 20;

  const fetchHistory = useCallback(
    async (p: number, append = false) => {
      if (!userId) {
        setLoading(false);
        setFetchError("Unable to load history for this account.");
        return;
      }
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setFetchError(null);
      try {
        const res = await fetch(`/api/history?page=${p}&pageSize=${pageSize}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load history");
        setRecords((prev) => (append ? [...prev, ...(json.data ?? [])] : (json.data ?? [])));
        setTotal(json.total ?? 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load history";
        setFetchError(message);
        toast.error(message);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleDelete = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  if (loading) return <HistorySkeleton />;

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-border">
        <p className="font-medium text-foreground">Could not load history</p>
        <p className="text-sm text-muted-foreground max-w-sm">{fetchError}</p>
        <Button variant="outline" onClick={() => fetchHistory(1)}>
          Try again
        </Button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-border">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          <Clock className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No analyses yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Run your first analysis and it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} analysis{total !== 1 ? "es" : ""} saved
        </p>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <HistoryCard key={record.id} record={record} onDelete={handleDelete} />
        ))}
      </div>

      {records.length < total && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? "Loading…" : `Load more (${total - records.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
