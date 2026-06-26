"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityEventRow } from "@/lib/activity";

export function ActivityShell() {
  const [events, setEvents] = useState<ActivityEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (filter !== "all") params.set("action", filter);
      const res = await fetch(`/api/activity?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEvents((prev) => (append ? [...prev, ...(json.data ?? [])] : json.data ?? []));
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Activity Feed</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Unified timeline across analyses, scans, exports, and workspace actions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="size-4 text-muted-foreground" />
        {[
          { id: "all", label: "All" },
          { id: "analysis.created", label: "Analyses" },
          { id: "scan.completed", label: "Scans" },
          { id: "cicd.checked", label: "CI/CD" },
          { id: "share.created", label: "Shares" },
        ].map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
          <Activity className="size-10 opacity-30" />
          <p>No activity yet. Run an analysis or scan to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-border bg-card px-4 py-3 flex gap-3 items-start">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.title}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {e.action.replace(".", " ")}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(e.created_at)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {events.length < total && (
        <Button
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            load(next, true);
          }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Load more"}
        </Button>
      )}
    </div>
  );
}
