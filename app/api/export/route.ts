import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  exportAsCsv,
  exportAsJson,
  exportAsPdfText,
  getExportContentType,
  getExportFilename,
  type ExportFormat,
} from "@/lib/export";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { format, title, type, data } = body as {
      format: ExportFormat;
      title: string;
      type: string;
      data: Record<string, unknown>;
    };

    if (!format || !title || !data) {
      return NextResponse.json({ success: false, error: "Invalid export payload" }, { status: 400 });
    }

    const payload = {
      title,
      type: type ?? "report",
      generatedAt: new Date().toISOString(),
      data,
    };

    let content: string;
    switch (format) {
      case "csv":
        content = exportAsCsv(payload);
        break;
      case "pdf":
        content = exportAsPdfText(payload);
        break;
      default:
        content = exportAsJson(payload);
    }

    await logActivity(auth.supabase, auth.user.id, {
      action: "share.created",
      entityType: "export",
      title: `Exported ${title} as ${format}`,
      metadata: { format, type },
    });

    return new NextResponse(content, {
      headers: {
        "Content-Type": getExportContentType(format),
        "Content-Disposition": `attachment; filename="${getExportFilename(title, format)}"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
