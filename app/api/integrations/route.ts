import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("integration_tokens")
    .select("id, provider, account_login, created_at, expires_at")
    .eq("user_id", auth.user.id);

  if (error && !error.message.includes("does not exist")) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { provider, accessToken, accountLogin } = await request.json();

  if (!provider || !accessToken) {
    return NextResponse.json({ success: false, error: "Provider and token required" }, { status: 400 });
  }

  if (!["github", "gitlab"].includes(provider)) {
    return NextResponse.json({ success: false, error: "Unsupported provider" }, { status: 400 });
  }

  const { error } = await auth.supabase.from("integration_tokens").upsert(
    {
      user_id: auth.user.id,
      provider,
      access_token: accessToken,
      account_login: accountLogin ?? null,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Integrations require schema-v2.sql in Supabase" },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const provider = request.nextUrl.searchParams.get("provider");
  if (!provider) {
    return NextResponse.json({ success: false, error: "Provider required" }, { status: 400 });
  }

  await auth.supabase
    .from("integration_tokens")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("provider", provider);

  return NextResponse.json({ success: true });
}
