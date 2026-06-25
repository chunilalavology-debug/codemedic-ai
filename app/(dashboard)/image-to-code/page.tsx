import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ImageShell } from "@/components/image-to-code/image-shell";

export const metadata: Metadata = { title: "Image to Code" };

export default async function ImageToCodePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Image → Code Generator" user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        <ImageShell />
      </main>
    </div>
  );
}
