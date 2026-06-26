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
  Activity,
  GitBranch,
  Users,
  X,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/sign-out";
import { getUserProfile } from "@/lib/profile";
import { useSidebar } from "@/lib/sidebar-context";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/activity", label: "Activity", icon: Activity },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/analyze", label: "Code Analyzer", icon: Bug },
      { href: "/scan", label: "Site & Repo Scanner", icon: Globe },
      { href: "/image-to-code", label: "Image → Code", icon: Image },
      { href: "/api-inspector", label: "API Inspector", icon: Zap },
      { href: "/cicd", label: "CI/CD Checker", icon: GitBranch },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/history", label: "History", icon: Clock },
      { href: "/reports", label: "Reports", icon: BarChart2 },
      { href: "/workspace", label: "Workspace", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user: SupabaseUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { open: mobileOpen, close: closeMobile } = useSidebar();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const result = await signOut();
    if (result?.ok === false) {
      toast.error(result.message);
      setSigningOut(false);
      return;
    }
    toast.success("Signed out");
  }

  const profile = getUserProfile(user);

  const asideClass = cn(
    "relative flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200 shrink-0",
    collapsed ? "w-16" : "w-60",
    "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[120] max-lg:shadow-xl",
    "max-lg:w-72",
    !mobileOpen && "max-lg:-translate-x-full"
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[110] bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside className={asideClass} aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between px-4 border-b border-border shrink-0">
          {collapsed ? <Logo showText={false} size="sm" /> : <Logo size="sm" />}
          <button
            type="button"
            className="lg:hidden cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

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
                  const linkClassName = cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  );
                  const content = (
                    <>
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={href}>
                        <TooltipTrigger
                          render={
                            <Link
                              href={href}
                              className={linkClassName}
                              aria-label={label}
                            />
                          }
                        >
                          {content}
                        </TooltipTrigger>
                        <TooltipContent side="right">{label}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link key={href} href={href} className={linkClassName}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-3">
              <UserAvatar user={user} size="sm" className="size-7" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {profile.displayName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}

          <div className="px-2 pb-2">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full cursor-pointer items-center justify-center rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Sign out"
                    />
                  }
                >
                  <LogOut className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="size-4 shrink-0" />
                Sign out
              </button>
            )}
          </div>

          <div className="hidden lg:block px-2 pb-2 border-t border-border pt-2">
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
    </>
  );
}

export function MobileMenuButton() {
  const { toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden shrink-0"
      onClick={toggle}
      aria-label="Open menu"
    >
      <Menu className="size-5" />
    </Button>
  );
}
