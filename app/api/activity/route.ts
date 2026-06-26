import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));
  const action = searchParams.get("action");
  const from = (page - 1) * pageSize;

  let query = auth.supabase
    .from("activity_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (action) query = query.eq("action", action);

  const { data, error, count } = await query;

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json({ success: true, data: [], total: 0, page, pageSize });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
