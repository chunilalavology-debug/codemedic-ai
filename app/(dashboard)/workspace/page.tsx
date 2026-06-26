import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Workspace" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <WorkspaceShell user={user} />
      </main>
    </div>
  );
}
