import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityAction =
  | "analysis.created"
  | "analysis.deleted"
  | "scan.completed"
  | "image_to_code.generated"
  | "api.tested"
  | "cicd.checked"
  | "share.created"
  | "workspace.created"
  | "member.invited";

export interface ActivityEventInput {
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  title: string;
  workspaceId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ActivityEventRow {
  id: string;
  user_id: string;
  workspace_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  event: ActivityEventInput
): Promise<void> {
  try {
    const { error } = await supabase.from("activity_events").insert({
      user_id: userId,
      workspace_id: event.workspaceId ?? null,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId ?? null,
      title: event.title,
      metadata: event.metadata ?? {},
    });
    if (error && !error.message.includes("does not exist")) {
      console.error("[activity]", error.message);
    }
  } catch {
    // Non-fatal — table may not exist until schema-v2 is applied
  }
}

export function computeQualityScore(result: {
  errors?: unknown[];
  securityIssues?: unknown[];
  performanceIssues?: unknown[];
  confidence?: number;
}): number {
  const errors = result.errors?.length ?? 0;
  const security = result.securityIssues?.length ?? 0;
  const perf = result.performanceIssues?.length ?? 0;
  const penalty = errors * 8 + security * 10 + perf * 5;
  const base = Math.round((result.confidence ?? 0.85) * 100);
  return Math.max(0, Math.min(100, base - penalty));
}
