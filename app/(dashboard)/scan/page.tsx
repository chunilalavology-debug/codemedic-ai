import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ScanShell } from "@/components/scan/scan-shell";

export const metadata: Metadata = { title: "Scanner" };

export default async function ScanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Site & Repo Scanner" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <ScanShell />
      </main>
    </div>
  );
}
