import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { isErrorResponse, parseJsonBody } from "@/lib/api-json";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody<{
    resourceType?: string;
    resourceId?: string;
    resourceData?: Record<string, unknown>;
    title?: string;
    expiryDays?: number;
  }>(request);

  if (isErrorResponse(body)) return body;

  const { resourceType, resourceId, resourceData, title, expiryDays } = body;

  if (!resourceType || !resourceData) {
    return NextResponse.json({ success: false, error: "Invalid share payload" }, { status: 400 });
  }

  const expiresAt =
    expiryDays && Number(expiryDays) > 0
      ? new Date(Date.now() + Number(expiryDays) * 86400000).toISOString()
      : null;

  const { data, error } = await auth.supabase
    .from("share_links")
    .insert({
      user_id: auth.user.id,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      resource_data: { ...resourceData, title: title ?? "Shared report" },
      expires_at: expiresAt,
    })
    .select("token")
    .single();

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Share links require schema-v2.sql in Supabase" },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const url = `${base}/share/${data.token}`;

  await logActivity(auth.supabase, auth.user.id, {
    action: "share.created",
    entityType: resourceType,
    entityId: resourceId,
    title: `Shared: ${title ?? resourceType}`,
  });

  return NextResponse.json({ success: true, url, token: data.token });
}
