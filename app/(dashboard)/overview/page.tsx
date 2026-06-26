import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { OverviewShell } from "@/components/overview/overview-shell";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch quick stats
  const { count: totalAnalyses } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "");

  const { data: recentRows } = await supabase
    .from("analyses")
    .select("id, title, language, analysis_type, created_at, result")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Overview" user={user} />
      <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-muted/20 via-background to-background">
        <OverviewShell
          user={user}
          totalAnalyses={totalAnalyses ?? 0}
          recentAnalyses={recentRows ?? []}
        />
      </main>
    </div>
  );
}
