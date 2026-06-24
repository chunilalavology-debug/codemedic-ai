import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { HistoryShell } from "@/components/history/history-shell";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Analysis History" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <HistoryShell userId={user?.id ?? ""} />
      </main>
    </div>
  );
}
