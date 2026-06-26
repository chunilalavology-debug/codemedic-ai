import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Shared Report — CodeMedic AI" };

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data, error } = await admin
    .from("share_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) notFound();

  if (data.expires_at && new Date(data.expires_at) < new Date()) notFound();

  await admin.rpc("increment_share_view_count", { p_token: token });

  const payload = data.resource_data as Record<string, unknown>;
  const title = (payload.title as string) ?? "Shared report";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Badge variant="outline" className="mb-2">Public share</Badge>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shared via CodeMedic AI · {data.resource_type}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Report data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-[70vh] whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
