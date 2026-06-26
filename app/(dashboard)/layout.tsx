import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/platform/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/preferences";
import { ensurePersonalWorkspace } from "@/lib/workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensurePersonalWorkspace(
    supabase,
    user.id,
    user.user_metadata?.full_name as string | undefined
  );
  const prefs = await getUserPreferences(supabase, user.id);

  return (
    <DashboardShell onboardingCompleted={prefs.onboardingCompleted}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
