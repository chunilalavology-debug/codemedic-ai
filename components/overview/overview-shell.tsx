"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bug,
  Globe,
  Image,
  Zap,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  BarChart2,
  Sparkles,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { getUserProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
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
    color: "text-red-500",
    bg: "bg-red-500/10",
    ring: "group-hover:ring-red-500/20",
  },
  {
    href: "/scan",
    icon: Globe,
    label: "Scan Website",
    description: "Audit a site, GitHub, or GitLab repo",
    color: "text-green-500",
    bg: "bg-green-500/10",
    ring: "group-hover:ring-green-500/20",
  },
  {
    href: "/image-to-code",
    icon: Image,
    label: "Image → Code",
    description: "Convert a UI screenshot to code",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    ring: "group-hover:ring-purple-500/20",
  },
  {
    href: "/api-inspector",
    icon: Zap,
    label: "Test API",
    description: "Inspect and validate any endpoint",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    ring: "group-hover:ring-orange-500/20",
  },
];

const analysisTypeBadge: Record<string, string> = {
  all: "Full Scan",
  error: "Errors",
  security: "Security",
  performance: "Performance",
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export function OverviewShell({ user, totalAnalyses, recentAnalyses }: OverviewShellProps) {
  const { displayName } = getUserProfile(user);
  const name = displayName.split(" ")[0] ?? "there";

  const totalIssues = recentAnalyses.reduce((sum, r) => {
    const s = r.result?.securityIssues?.length ?? 0;
    const e = r.result?.errors?.length ?? 0;
    return sum + s + e;
  }, 0);

  const avgConfidence = recentAnalyses.length
    ? Math.round(
        (recentAnalyses.reduce((s, r) => s + (r.result?.confidence ?? 0), 0) /
          recentAnalyses.length) *
          100
      )
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-4">
      {/* Hero welcome */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 100% 0%, oklch(0.58 0.22 38), transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, oklch(0.5 0.24 22), transparent 50%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.58 0.22 38 / 0.5), transparent)",
          }}
        />
        <div className="relative flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary text-[10px] uppercase tracking-wider">
                <Sparkles className="size-3 mr-1" />
                Dashboard
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Good{getGreeting()}, {name} 👋
            </h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Here&apos;s your workspace at a glance — jump into any tool or pick up where you left off.
            </p>
          </div>
          <Link
            href="/analyze"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium gradient-primary text-white shadow-md shadow-primary/15 hover:opacity-95 transition-opacity"
          >
            New analysis
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Bug}
          label="Total Analyses"
          value={totalAnalyses}
          iconClass="text-red-500"
          bgClass="bg-red-500/10"
          accent="from-red-500/8 to-transparent"
        />
        <StatCard
          icon={Shield}
          label="Issues Found"
          value={totalIssues}
          iconClass="text-orange-500"
          bgClass="bg-orange-500/10"
          accent="from-orange-500/8 to-transparent"
          note="in recent 5"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Confidence"
          value={avgConfidence !== null ? `${avgConfidence}%` : "—"}
          iconClass="text-green-500"
          bgClass="bg-green-500/10"
          accent="from-green-500/8 to-transparent"
        />
        <StatCard
          icon={Clock}
          label="Last Activity"
          value={
            recentAnalyses[0]
              ? formatRelativeTime(recentAnalyses[0].created_at)
              : "—"
          }
          iconClass="text-amber-500"
          bgClass="bg-amber-500/10"
          accent="from-amber-500/8 to-transparent"
          smallValue
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Quick Actions
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 + i * 0.04 }}
            >
              <Link href={action.href} className="group block h-full">
                <Card
                  className={cn(
                    "h-full border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200",
                    "hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                    "ring-1 ring-transparent",
                    action.ring
                  )}
                >
                  <CardContent className="p-3.5 sm:p-4">
                    <div
                      className={cn(
                        "mb-2.5 inline-flex size-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                        action.bg
                      )}
                    >
                      <action.icon className={cn("size-4", action.color)} />
                    </div>
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight className="size-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Analyses */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="size-4 text-primary" />
            Recent Analyses
          </h3>
          <Link
            href="/history"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/5"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </div>

        {recentAnalyses.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15">
                <BarChart2 className="size-6 text-primary/60" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">
                No analyses yet
              </CardTitle>
              <CardDescription className="mt-1 text-xs max-w-xs">
                Start by analyzing code or scanning a website — results appear here instantly.
              </CardDescription>
              <Link
                href="/analyze"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium gradient-primary text-white shadow-sm"
              >
                Analyze your first snippet
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentAnalyses.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
              >
                <Card className="group border-border/60 hover:border-primary/20 hover:bg-muted/20 transition-all duration-200">
                  <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
                    <div className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bug className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                        {row.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(row.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-mono">
                        {row.language}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {analysisTypeBadge[row.analysis_type] ?? row.analysis_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
  accent,
  note,
  smallValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClass: string;
  bgClass: string;
  accent: string;
  note?: string;
  smallValue?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-sm hover:shadow-md hover:border-primary/15 transition-all duration-200">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 dark:opacity-40",
          accent
        )}
      />
      <CardContent className="relative p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
            {label}
          </span>
          <div className={cn("flex size-7 items-center justify-center rounded-lg shrink-0", bgClass)}>
            <Icon className={cn("size-3.5", iconClass)} />
          </div>
        </div>
        <p
          className={cn(
            "font-bold text-foreground tracking-tight",
            smallValue ? "text-sm font-semibold" : "text-xl"
          )}
        >
          {value}
        </p>
        {note && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{note}</p>}
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
