import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMemberRow {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "workspace";
}

export async function ensurePersonalWorkspace(
  supabase: SupabaseClient,
  userId: string,
  displayName?: string
): Promise<WorkspaceRow | null> {
  try {
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(*)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existing?.workspaces) {
      return existing.workspaces as unknown as WorkspaceRow;
    }

    const name = displayName ? `${displayName}'s Workspace` : "My Workspace";
    const slug = `${slugify(name)}-${userId.slice(0, 8)}`;

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name, slug, owner_id: userId })
      .select()
      .single();

    if (wsError || !workspace) return null;

    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "owner",
    });

    return workspace as WorkspaceRow;
  } catch {
    return null;
  }
}

export async function getUserWorkspaces(
  supabase: SupabaseClient,
  userId: string
): Promise<(WorkspaceRow & { role: WorkspaceRole })[]> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("role, workspaces(id, name, slug, owner_id, created_at)")
      .eq("user_id", userId);

    if (!data) return [];

    return data
      .filter((row) => row.workspaces)
      .map((row) => ({
        ...(row.workspaces as unknown as WorkspaceRow),
        role: row.role as WorkspaceRole,
      }));
  } catch {
    return [];
  }
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}
