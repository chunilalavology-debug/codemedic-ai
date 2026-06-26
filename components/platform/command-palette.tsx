"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bug,
  Globe,
  Image,
  Zap,
  Clock,
  BarChart2,
  Settings,
  Activity,
  GitBranch,
  Users,
  MessageSquare,
  Search,
} from "lucide-react";
import { usePlatform } from "@/lib/platform-context";
import { cn } from "@/lib/utils";
import type { CommandItem } from "@/types/platform";

const COMMANDS: CommandItem[] = [
  { id: "overview", label: "Go to Overview", href: "/overview", group: "Navigation", keywords: ["home", "dashboard"] },
  { id: "analyze", label: "Code Analyzer", href: "/analyze", group: "Navigation", keywords: ["fix", "debug"] },
  { id: "scan", label: "Site & Repo Scanner", href: "/scan", group: "Navigation", keywords: ["seo", "audit"] },
  { id: "image", label: "Image to Code", href: "/image-to-code", group: "Navigation", keywords: ["screenshot", "ui"] },
  { id: "api", label: "API Inspector", href: "/api-inspector", group: "Navigation", keywords: ["http", "rest"] },
  { id: "cicd", label: "CI/CD Checker", href: "/cicd", group: "Navigation", keywords: ["pipeline", "github actions"] },
  { id: "activity", label: "Activity Feed", href: "/activity", group: "Navigation", keywords: ["timeline", "log"] },
  { id: "history", label: "Analysis History", href: "/history", group: "Navigation" },
  { id: "reports", label: "Reports", href: "/reports", group: "Navigation" },
  { id: "workspace", label: "Workspace Settings", href: "/workspace", group: "Navigation", keywords: ["team", "invite"] },
  { id: "settings", label: "Settings", href: "/settings", group: "Navigation" },
  { id: "chat", label: "Open AI Assistant", action: "chat", group: "Actions", keywords: ["ai", "help"] },
];

const ICONS: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  analyze: Bug,
  scan: Globe,
  image: Image,
  api: Zap,
  cicd: GitBranch,
  activity: Activity,
  history: Clock,
  reports: BarChart2,
  workspace: Users,
  settings: Settings,
  chat: MessageSquare,
};

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, closeCommand, toggleChat } = usePlatform();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.includes(q))
    );
  }, [query]);

  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [commandOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function run(item: CommandItem) {
    closeCommand();
    if (item.action === "chat") {
      toggleChat();
      return;
    }
    if (item.href) router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      run(filtered[activeIndex]);
    }
  }

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 p-4 pt-[15vh]"
      onClick={closeCommand}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands… (Ctrl+K)"
            className="flex-1 bg-transparent py-3 text-sm outline-none"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No commands found</li>
          ) : (
            filtered.map((item, i) => {
              const Icon = ICONS[item.id] ?? Search;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => run(item)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-left",
                      i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.group}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
