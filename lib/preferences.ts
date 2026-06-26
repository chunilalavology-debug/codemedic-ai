import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TEXT_MODEL, DEFAULT_VISION_MODEL } from "@/lib/ai-models";

export interface UserPreferences {
  preferredTextModel: string;
  preferredVisionModel: string;
  activeWorkspaceId: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

const defaults: UserPreferences = {
  preferredTextModel: DEFAULT_TEXT_MODEL,
  preferredVisionModel: DEFAULT_VISION_MODEL,
  activeWorkspaceId: null,
  onboardingCompleted: false,
  onboardingStep: 0,
};

export async function getUserPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  try {
    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return { ...defaults };

    return {
      preferredTextModel: data.preferred_text_model ?? DEFAULT_TEXT_MODEL,
      preferredVisionModel: data.preferred_vision_model ?? DEFAULT_VISION_MODEL,
      activeWorkspaceId: data.active_workspace_id ?? null,
      onboardingCompleted: Boolean(data.onboarding_completed),
      onboardingStep: data.onboarding_step ?? 0,
    };
  } catch {
    return { ...defaults };
  }
}

export async function upsertUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<UserPreferences>
): Promise<{ ok: boolean; message?: string }> {
  try {
    const definedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    ) as Partial<UserPreferences>;

    if (Object.keys(definedPatch).length === 0) {
      return { ok: true };
    }

    const current = await getUserPreferences(supabase, userId);
    const merged = { ...current, ...definedPatch };

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      preferred_text_model: merged.preferredTextModel,
      preferred_vision_model: merged.preferredVisionModel,
      active_workspace_id: merged.activeWorkspaceId,
      onboarding_completed: merged.onboardingCompleted,
      onboarding_step: merged.onboardingStep,
      updated_at: new Date().toISOString(),
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to save preferences",
    };
  }
}
