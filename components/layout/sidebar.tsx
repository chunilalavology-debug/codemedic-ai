"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bug,
  Globe,
  Image,
  Zap,
  Clock,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/sign-out";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/analyze", label: "Code Analyzer", icon: Bug },
      { href: "/scan", label: "Site & Repo Scanner", icon: Globe },
      { href: "/image-to-code", label: "Image → Code", icon: Image },
      { href: "/api-inspector", label: "API Inspector", icon: Zap },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/history", label: "History", icon: Clock },
      { href: "/reports", label: "Reports", icon: BarChart2 },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user: SupabaseUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    toast.success("Signed out");
    const result = await signOut();
    if (result?.ok === false) {
      toast.error(result.message);
    }
  }

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-border shrink-0">
        {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4 pt-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                const link = (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={href}>
                      <TooltipTrigger render={<span />}>{link}</TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return link;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="border-t border-border shrink-0">
        {/* User row */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Account"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}

        {/* Sign out button */}
        <div className="px-2 pb-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="size-4 shrink-0" />
              Sign out
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-2 border-t border-border pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className="w-full h-7 text-muted-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
