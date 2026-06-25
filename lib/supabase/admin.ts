import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureAvatarsBucket() {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, reason: "missing_service_role" as const };

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    return { ok: false as const, reason: "list_failed" as const, message: listError.message };
  }

  const exists = buckets.some((bucket) => bucket.id === "avatars");
  if (exists) {
    return { ok: true as const, created: false as const };
  }

  const { error: createError } = await admin.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  if (createError) {
    return { ok: false as const, reason: "create_failed" as const, message: createError.message };
  }

  return { ok: true as const, created: true as const };
}
