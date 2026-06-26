import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { analyzeCicdYaml, mergeCicdResults } from "@/lib/cicd-checker";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { files } = body as { files: { name: string; content: string }[] };

    if (!files?.length) {
      return NextResponse.json({ success: false, error: "No pipeline files provided" }, { status: 400 });
    }

    const results = files.map((f) => analyzeCicdYaml(f.content, f.name));
    const merged = mergeCicdResults(results);

    await logActivity(auth.supabase, auth.user.id, {
      action: "cicd.checked",
      entityType: "cicd",
      title: `CI/CD check: ${merged.provider}`,
      metadata: { score: merged.score, issueCount: merged.issues.length },
    });

    return NextResponse.json({ success: true, data: merged });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "CI/CD check failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
