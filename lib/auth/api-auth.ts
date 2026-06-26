import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import type { User } from "@supabase/supabase-js";

type AuthSuccess = {
  ok: true;
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireApiUser(
  rateLimitRoute?: string
): Promise<AuthSuccess | AuthFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (rateLimitRoute) {
    const limited = checkRateLimit(rateLimitKey(user.id, rateLimitRoute));
    if (limited) {
      return { ok: false, response: limited };
    }
  }

  return { ok: true, user, supabase };
}
