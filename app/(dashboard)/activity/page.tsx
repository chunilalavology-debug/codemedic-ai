import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { ActivityShell } from "@/components/activity/activity-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Activity" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <ActivityShell />
      </main>
    </div>
  );
}
