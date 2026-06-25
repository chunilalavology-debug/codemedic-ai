import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ReportsShell } from "@/components/reports/reports-shell";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("analyses")
    .select("id, language, analysis_type, created_at, result")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Reports" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <ReportsShell rows={rows ?? []} />
      </main>
    </div>
  );
}
