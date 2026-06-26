import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isErrorResponse, parseJsonBody } from "@/lib/api-json";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("workspace_invitations")
    .select("id, email, role, expires_at, accepted_at, workspaces(id, name, slug)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
  }

  if (data.accepted_at) {
    return NextResponse.json({ success: false, error: "Invitation already accepted" }, { status: 410 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: "Invitation expired" }, { status: 410 });
  }

  const workspaceRaw = data.workspaces as unknown;
  const workspace = (Array.isArray(workspaceRaw) ? workspaceRaw[0] : workspaceRaw) as
    | { id: string; name: string; slug: string }
    | null
    | undefined;

  return NextResponse.json({
    success: true,
    invitation: {
      email: data.email,
      role: data.role,
      workspaceName: workspace?.name ?? "Workspace",
      workspaceId: workspace?.id,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Sign in to accept" }, { status: 401 });
  }

  const body = await parseJsonBody<{ token?: string }>(request);
  if (isErrorResponse(body)) return body;

  const { token } = body;
  if (!token) {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }

  const { data: invite, error: inviteError } = await admin
    .from("workspace_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ success: false, error: "Already accepted" }, { status: 410 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: "Invitation expired" }, { status: 410 });
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        success: false,
        error: `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      },
      { status: 403 }
    );
  }

  const { error: memberError } = await supabase.from("workspace_members").upsert(
    {
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role,
    },
    { onConflict: "workspace_id,user_id" }
  );

  if (memberError) {
    return NextResponse.json({ success: false, error: memberError.message }, { status: 500 });
  }

  const { error: acceptError } = await supabase
    .from("workspace_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (acceptError) {
    return NextResponse.json({ success: false, error: acceptError.message }, { status: 500 });
  }

  await supabase.from("user_preferences").upsert({
    user_id: user.id,
    active_workspace_id: invite.workspace_id,
    updated_at: new Date().toISOString(),
  });

  await logActivity(supabase, user.id, {
    action: "member.joined",
    entityType: "workspace",
    entityId: invite.workspace_id,
    title: "Joined workspace via invitation",
    workspaceId: invite.workspace_id,
  });

  return NextResponse.json({ success: true, workspaceId: invite.workspace_id });
}
