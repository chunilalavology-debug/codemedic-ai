import { NextRequest, NextResponse } from "next/server";
import { analyzeCode } from "@/lib/claude";
import { saveAnalysis } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;

    if (!body.code?.trim()) {
      return NextResponse.json<AnalyzeResponse>(
        { success: false, error: "Code is required" },
        { status: 400 }
      );
    }

    const result = await analyzeCode(body);

    // Save to history — best-effort, never fails the response
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await saveAnalysis(body, result, user.id);
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
