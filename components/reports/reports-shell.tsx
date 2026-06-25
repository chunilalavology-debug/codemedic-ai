"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart2, Bug, Shield, Zap, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: string;
  language: string;
  analysis_type: string;
  created_at: string;
  result: {
    confidence?: number;
    securityIssues?: unknown[];
    performanceIssues?: unknown[];
    errors?: unknown[];
  };
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function ReportsShell({ rows }: { rows: Row[] }) {
  const stats = useMemo(() => {
    const byLanguage: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let totalSecurity = 0;
    let totalPerf = 0;
    let totalErrors = 0;
    let totalConf = 0;

    for (const row of rows) {
      byLanguage[row.language] = (byLanguage[row.language] ?? 0) + 1;
      byType[row.analysis_type] = (byType[row.analysis_type] ?? 0) + 1;
      const day = new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] ?? 0) + 1;
      totalSecurity += row.result?.securityIssues?.length ?? 0;
      totalPerf += row.result?.performanceIssues?.length ?? 0;
      totalErrors += row.result?.errors?.length ?? 0;
      totalConf += row.result?.confidence ?? 0;
    }

    const avgConf = rows.length ? Math.round((totalConf / rows.length) * 100) : 0;
    const langData = Object.entries(byLanguage).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    const typeData = Object.entries(byType).map(([name, value]) => ({ name: typeLabel(name), value }));
    const dayData = Object.entries(byDay).slice(-14).map(([name, value]) => ({ name, value }));

    return { langData, typeData, dayData, totalSecurity, totalPerf, totalErrors, avgConf, total: rows.length };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <BarChart2 className="size-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">No analyses yet</p>
        <p className="text-sm text-muted-foreground">Run some analyses to see your reports here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated insights from your {stats.total} analyses.
        </p>
      </div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { icon: Bug, label: "Total Analyses", value: stats.total, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: Shield, label: "Security Issues", value: stats.totalSecurity, color: "text-red-500", bg: "bg-red-500/10" },
          { icon: Zap, label: "Perf Issues", value: stats.totalPerf, color: "text-orange-500", bg: "bg-orange-500/10" },
          { icon: TrendingUp, label: "Avg Confidence", value: `${stats.avgConf}%`, color: "text-green-500", bg: "bg-green-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className={`size-7 rounded-md flex items-center justify-center ${bg}`}>
                  <Icon className={`size-3.5 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity over time */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activity (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.dayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Language breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Languages Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.langData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {stats.langData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analysis type breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Analysis Type Breakdown</CardTitle>
            <CardDescription className="text-xs">How you&apos;re using CodeMedic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.typeData.map(({ name, value }) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{name}</span>
                  <Badge variant="secondary">{value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top languages table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Language Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats.langData.map(({ name, value }, idx) => {
                const pct = Math.round((value / stats.total) * 100);
                return (
                  <div key={name} className="flex items-center gap-4 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                    <span className="text-sm font-mono font-medium flex-1">{name}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function typeLabel(t: string) {
  return { all: "Full Scan", error: "Errors", security: "Security", performance: "Performance" }[t] ?? t;
}
