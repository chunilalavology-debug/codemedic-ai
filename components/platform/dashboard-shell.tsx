"use client";

import { SidebarProvider } from "@/lib/sidebar-context";
import { PlatformProvider } from "@/lib/platform-context";
import { CommandPalette } from "@/components/platform/command-palette";
import { AiChatPanel } from "@/components/platform/ai-chat-panel";
import { OnboardingFlow } from "@/components/platform/onboarding-flow";
import { KeyboardShortcuts } from "@/components/platform/keyboard-shortcuts";

interface DashboardShellProps {
  children: React.ReactNode;
  onboardingCompleted?: boolean;
}

export function DashboardShell({
  children,
  onboardingCompleted = true,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <PlatformProvider>
        <KeyboardShortcuts />
        {children}
        <CommandPalette />
        <AiChatPanel />
        {!onboardingCompleted && <OnboardingFlow />}
      </PlatformProvider>
    </SidebarProvider>
  );
}
