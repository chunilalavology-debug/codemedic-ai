import { NextRequest, NextResponse } from "next/server";
import { getHistory, deleteAnalysis } from "@/lib/history";
import { createClient } from "@/lib/supabase/server";
import type { HistoryResponse } from "@/types";

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, parsed));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<HistoryResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 20, 50);

    const { records, total } = await getHistory(user.id, page, pageSize);

    return NextResponse.json<HistoryResponse>({
      success: true,
      data: records,
      total,
      page,
      pageSize,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json<HistoryResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const idsParam = searchParams.get("ids");

    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      const { deleteAnalyses } = await import("@/lib/history");
      const deleted = await deleteAnalyses(ids, user.id);
      return NextResponse.json({ success: true, deleted });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Record ID is required" },
        { status: 400 }
      );
    }

    await deleteAnalysis(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
