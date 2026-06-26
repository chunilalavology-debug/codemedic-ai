import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { CicdShell } from "@/components/cicd/cicd-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CI/CD Checker" };

export default async function CicdPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="CI/CD Checker" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <CicdShell />
      </main>
    </div>
  );
}
