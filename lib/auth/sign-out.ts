"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signOutAction } from "@/lib/auth/actions";

export async function signOut(): Promise<{ ok: false; message: string } | void> {
  try {
    await signOutAction();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to sign out",
    };
  }
}
