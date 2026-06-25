import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { InspectorShell } from "@/components/api-inspector/inspector-shell";

export const metadata: Metadata = { title: "API Inspector" };

export default async function ApiInspectorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="API Inspector" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <InspectorShell />
      </main>
    </div>
  );
}
