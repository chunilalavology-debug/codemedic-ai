import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/utils";
import { requireApiUser } from "@/lib/auth/api-auth";
import type { UploadedFile } from "@/types";

const MAX_FILE_SIZE = 100 * 1024; // 100 KB
const MAX_FILES = 10;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const uploaded: UploadedFile[] = [];
    const skipped: string[] = [];

    for (const file of files.slice(0, MAX_FILES)) {
      if (file.size > MAX_FILE_SIZE) {
        skipped.push(file.name);
        continue;
      }
      const content = await file.text();
      uploaded.push({
        name: file.name,
        content,
        language: detectLanguage(content, file.name),
        size: file.size,
      });
    }

    return NextResponse.json({ success: true, data: uploaded, skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
