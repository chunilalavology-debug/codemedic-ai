import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { upsertUserPreferences, getUserPreferences } from "@/lib/preferences";
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

  const body = await request.json();
  const result = await upsertUserPreferences(auth.supabase, auth.user.id, {
    preferredTextModel: body.preferredTextModel,
    preferredVisionModel: body.preferredVisionModel,
    activeWorkspaceId: body.activeWorkspaceId,
    onboardingCompleted: body.onboardingCompleted,
    onboardingStep: body.onboardingStep,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
