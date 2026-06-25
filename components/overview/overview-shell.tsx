"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bug, Globe, Image, Zap, ArrowRight, TrendingUp, Shield, Clock, BarChart2 } from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface RecentRow {
  id: string;
  title: string;
  language: string;
  analysis_type: string;
  created_at: string;
  result: { confidence: number; securityIssues?: unknown[]; errors?: unknown[] };
}

interface OverviewShellProps {
  user: SupabaseUser | null;
  totalAnalyses: number;
  recentAnalyses: RecentRow[];
}

const quickActions = [
  {
    href: "/analyze",
    icon: Bug,
    label: "Analyze Code",
    description: "Paste code and get AI-powered fixes",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    href: "/scan",
    icon: Globe,
    label: "Scan Website",
    description: "Audit a site or GitHub repo",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    href: "/image-to-code",
    icon: Image,
    label: "Image → Code",
    description: "Convert a UI screenshot to code",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    href: "/api-inspector",
    icon: Zap,
    label: "Test API",
    description: "Inspect and validate any endpoint",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const analysisTypeBadge: Record<string, string> = {
  all: "Full Scan",
  error: "Errors",
  security: "Security",
  performance: "Performance",
};

export function OverviewShell({ user, totalAnalyses, recentAnalyses }: OverviewShellProps) {
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  const totalIssues = recentAnalyses.reduce((sum, r) => {
    const s = r.result?.securityIssues?.length ?? 0;
    const e = r.result?.errors?.length ?? 0;
    return sum + s + e;
  }, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-2xl font-bold tracking-tight">
          Good{getGreeting()}, {name} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your projects.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Bug}
          label="Total Analyses"
          value={totalAnalyses}
          iconClass="text-blue-500"
          bgClass="bg-blue-500/10"
        />
        <StatCard
          icon={Shield}
          label="Issues Found"
          value={totalIssues}
          iconClass="text-red-500"
          bgClass="bg-red-500/10"
          note="in recent 5"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Confidence"
          value={
            recentAnalyses.length
              ? Math.round(
                  (recentAnalyses.reduce(
                    (s, r) => s + (r.result?.confidence ?? 0),
                    0
                  ) /
                    recentAnalyses.length) *
                    100
                ) + "%"
              : "—"
          }
          iconClass="text-green-500"
          bgClass="bg-green-500/10"
        />
        <StatCard
          icon={Clock}
          label="Last Activity"
          value={
            recentAnalyses[0]
              ? formatRelativeTime(recentAnalyses[0].created_at)
              : "—"
          }
          iconClass="text-orange-500"
          bgClass="bg-orange-500/10"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Quick Actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`mb-3 inline-flex size-9 items-center justify-center rounded-lg ${action.bg}`}>
                    <action.icon className={`size-4 ${action.color}`} />
                  </div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Analyses */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Recent Analyses
          </h3>
          <Link href="/history" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>

        {recentAnalyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart2 className="size-10 text-muted-foreground/30 mb-3" />
              <CardTitle className="text-base text-muted-foreground">No analyses yet</CardTitle>
              <CardDescription className="mt-1">
                Start by analyzing some code or scanning a website.
              </CardDescription>
              <Link href="/analyze" className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium gradient-primary text-white">
                Analyze your first snippet
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentAnalyses.map((row) => (
              <Card key={row.id} className="hover:border-border/80 transition-colors">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(row.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">
                      {row.language}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {analysisTypeBadge[row.analysis_type] ?? row.analysis_type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  bgClass,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass: string;
  bgClass: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`flex size-7 items-center justify-center rounded-md ${bgClass}`}>
            <Icon className={`size-3.5 ${iconClass}`} />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </CardContent>
    </Card>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return " morning";
  if (h < 18) return " afternoon";
  return " evening";
}
