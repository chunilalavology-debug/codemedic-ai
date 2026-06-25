"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, LogOut, User, Palette, Info, Shield, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { signOut } from "@/lib/auth/sign-out";
import { cn } from "@/lib/utils";

interface SettingsShellProps {
  user: SupabaseUser | null;
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function SettingsShell({ user }: SettingsShellProps) {
  const { theme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const result = await signOut();
    if (result?.ok === false) {
      toast.error(result.message);
      setSigningOut(false);
      return;
    }
    toast.success("Signed out successfully");
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Account */}
      <Section
        icon={User}
        title="Profile Settings"
        description="Update your photo, nickname, and personal details"
      >
        <ProfileForm user={user} />
      </Section>

      <Section
        icon={KeyRound}
        title="Password"
        description="Change your account password"
      >
        <PasswordForm user={user} />
      </Section>

      {/* Appearance */}
      <Section
        icon={Palette}
        title="Appearance"
        description="Customize how CodeMedic AI looks"
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all",
                  theme === value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* AI Engine */}
      <Section
        icon={Shield}
        title="AI Engine"
        description="Powered by Groq — ultra-fast inference"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Provider</p>
            <Badge className="bg-primary/10 text-primary border-primary/20">Groq</Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Model</p>
            <Badge variant="outline" className="font-mono text-xs">llama-3.3-70b-versatile</Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Daily limit</p>
            <Badge variant="secondary" className="text-xs">14,400 requests / day</Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Llama 3.3 70B via Groq delivers fast, high-quality code analysis.
            Your API key is stored server-side and never exposed to the browser.
          </p>
        </div>
      </Section>

      {/* About */}
      <Section
        icon={Info}
        title="About CodeMedic AI"
        description="Version and build info"
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Version</p>
            <Badge variant="outline" className="font-mono text-xs">v0.2.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Framework</p>
            <Badge variant="outline" className="font-mono text-xs">Next.js 16.2.9</Badge>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Built by</p>
            <p className="text-foreground font-medium">Shashi Thakur</p>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="text-sm font-semibold text-destructive mb-1">Sign out</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sign out of your CodeMedic AI account on this device.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="gap-2"
        >
          <LogOut className="size-3.5" />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
