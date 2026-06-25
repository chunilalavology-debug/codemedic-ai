"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { signOut } from "@/lib/auth/sign-out";
import { getUserProfile } from "@/lib/profile";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  title: string;
  user: SupabaseUser | null;
}

const MENU_WIDTH = 224;

export function Header({ title, user }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  function updateMenuPosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMenuPos({
      top: rect.bottom + 8,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }

    updateMenuPosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setOpen(false);
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

  const menu =
    open && menuPos && mounted
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="fixed z-[100] rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="sm" className="size-9" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile.displayName}
                  </p>
                  {profile.nickname && profile.fullName ? (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {profile.fullName}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {user?.email ?? "No email"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1">
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User className="size-4 text-muted-foreground" />
                Profile Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="size-4" />
                {signingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div ref={containerRef} className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleMenu}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User menu"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <UserAvatar user={user} size="sm" />
          </button>
        </div>

        {menu}
      </div>
    </header>
  );
}
