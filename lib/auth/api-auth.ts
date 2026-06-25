import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

export async function requireApiUser(): Promise<AuthSuccess | AuthFailure> {
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

  return { ok: true, user, supabase };
}
