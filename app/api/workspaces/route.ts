import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getUserWorkspaces, canManageMembers } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";
import { sendWorkspaceInviteEmail } from "@/lib/email";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  return NextResponse.json({ success: true, data: workspaces });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser("workspaces");
  if (!auth.ok) return auth.response;

  const { email, role, workspaceId } = await request.json();

  if (!email || !workspaceId || !role) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws || !canManageMembers(ws.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await auth.supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: workspaceId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: auth.user.id,
    })
    .select("id, token, email, role, expires_at")
    .single();

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json(
        { success: false, error: "Workspaces require schema-v2.sql in Supabase" },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const inviteUrl = `${base}/invite/${data.token}`;

  let emailResult;
  try {
    emailResult = await sendWorkspaceInviteEmail({
      to: data.email,
      workspaceName: ws.name,
      inviteUrl,
      inviterEmail: auth.user.email ?? undefined,
      role: data.role,
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      invitation: data,
      inviteUrl,
      emailSent: false,
      emailError: err instanceof Error ? err.message : "Email failed",
    });
  }

  await logActivity(auth.supabase, auth.user.id, {
    action: "member.invited",
    entityType: "workspace",
    entityId: workspaceId,
    title: `Invited ${email} as ${role}`,
    workspaceId,
    metadata: { emailSent: emailResult.sent },
  });

  return NextResponse.json({
    success: true,
    invitation: data,
    inviteUrl,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
  });
}
