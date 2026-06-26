import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { isErrorResponse, parseJsonBody } from "@/lib/api-json";
import { upsertUserPreferences, getUserPreferences, type UserPreferences } from "@/lib/preferences";
import { getUserWorkspaces } from "@/lib/workspace";
import { TEXT_MODELS, VISION_MODELS } from "@/lib/ai-models";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const prefs = await getUserPreferences(auth.supabase, auth.user.id);
  return NextResponse.json({
    success: true,
    preferences: prefs,
    textModels: TEXT_MODELS,
    visionModels: VISION_MODELS,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody<Partial<{
    preferredTextModel: string;
    preferredVisionModel: string;
    activeWorkspaceId: string | null;
    onboardingCompleted: boolean;
    onboardingStep: number;
  }>>(request);

  if (isErrorResponse(body)) return body;

  const patch: Partial<UserPreferences> = {};

  if (body.preferredTextModel !== undefined) patch.preferredTextModel = body.preferredTextModel;
  if (body.preferredVisionModel !== undefined) patch.preferredVisionModel = body.preferredVisionModel;
  if (body.activeWorkspaceId !== undefined) patch.activeWorkspaceId = body.activeWorkspaceId;
  if (body.onboardingCompleted !== undefined) patch.onboardingCompleted = body.onboardingCompleted;
  if (body.onboardingStep !== undefined) patch.onboardingStep = body.onboardingStep;

  if (patch.activeWorkspaceId) {
    const workspaces = await getUserWorkspaces(auth.supabase, auth.user.id);
    if (!workspaces.some((w) => w.id === patch.activeWorkspaceId)) {
      return NextResponse.json(
        { success: false, error: "You are not a member of that workspace" },
        { status: 403 }
      );
    }
  }

  const result = await upsertUserPreferences(auth.supabase, auth.user.id, patch);

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
