import { NextRequest, NextResponse } from "next/server";
import { ensureAvatarsBucket } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const AVATAR_SETUP_HINT =
  "Avatar storage is not configured. In Supabase Dashboard → SQL Editor, run the file supabase/avatars-bucket.sql (or run npm run setup:avatars locally).";

function avatarStorageError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("bucket not found")) {
    return AVATAR_SETUP_HINT;
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("permission denied")
  ) {
    return `Avatar upload is blocked by storage policies. ${AVATAR_SETUP_HINT}`;
  }

  return message;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Use JPG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be under 2 MB" },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    await ensureAvatarsBucket();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: avatarStorageError(uploadError.message),
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        avatar_url: avatarUrl,
      },
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
