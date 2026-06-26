"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Welcome to CodeMedic AI",
    body: "Your all-in-one AI developer platform — analyze code, scan sites, convert designs, and test APIs.",
  },
  {
    title: "Analyze broken code",
    body: "Paste code or upload a file on the Code Analyzer page. Add an error trace for better results.",
  },
  {
    title: "Scan & inspect",
    body: "Audit websites and GitHub repos, test HTTP endpoints, and check CI/CD pipeline health.",
  },
  {
    title: "Power shortcuts",
    body: "Press Ctrl+K for the command palette, Ctrl+Shift+A for the AI assistant, anywhere in the dashboard.",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (dismissed) return null;

  async function finish(skipped = false) {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingStep: skipped ? 0 : STEPS.length,
        }),
      });
    } catch {
      // still dismiss locally
    }
    setDismissed(true);
    if (!skipped) router.push("/analyze");
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold">Getting started</span>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Skip onboarding"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <h2 className="text-lg font-bold">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button variant="ghost" size="sm" onClick={() => finish(true)} disabled={saving}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => finish(false)} disabled={saving} className="gap-1">
                <Check className="size-3.5" /> Get started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1">
                Next <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
