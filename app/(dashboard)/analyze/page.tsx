import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { AnalyzerShell } from "@/components/analyze/analyzer-shell";

export const metadata: Metadata = { title: "Analyze" };

export default async function AnalyzePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Analyze Code" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <AnalyzerShell />
      </main>
    </div>
  );
}
