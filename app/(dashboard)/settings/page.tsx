import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { SettingsShell } from "@/components/settings/settings-shell";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <SettingsShell user={user} />
      </main>
    </div>
  );
}
