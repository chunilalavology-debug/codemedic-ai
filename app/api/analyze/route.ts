import { NextRequest, NextResponse } from "next/server";
import { analyzeCode } from "@/lib/claude";
import { saveAnalysis } from "@/lib/history";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getUserPreferences } from "@/lib/preferences";
import { logActivity } from "@/lib/activity";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser("analyze");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as AnalyzeRequest;

    if (!body.code?.trim()) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Code is required" },
        { status: 400 }
      );
    }

    if (body.code.length > 100_000) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Code must be under 100,000 characters" },
        { status: 400 }
      );
    }

    const prefs = await getUserPreferences(auth.supabase, auth.user.id);
    const result = await analyzeCode(body, prefs.preferredTextModel);

    try {
      const saved = await saveAnalysis(body, result, auth.user.id);
      await logActivity(auth.supabase, auth.user.id, {
        action: "analysis.created",
        entityType: "analysis",
        entityId: saved?.id,
        title: saved?.title ?? "Code analysis",
        workspaceId: prefs.activeWorkspaceId,
        metadata: { qualityScore: result.qualityScore, language: result.language },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json<AnalyzeResponse>({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json<AnalyzeResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
