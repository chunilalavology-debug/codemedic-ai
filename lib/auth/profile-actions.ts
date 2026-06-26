"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileUpdateInput {
  full_name: string;
  nickname: string;
  bio: string;
  website: string;
  location: string;
}

export async function updateProfileAction(input: ProfileUpdateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "Not authenticated" };
  }

  const website = input.website.trim();
  if (website) {
    try {
      new URL(website);
    } catch {
      return { ok: false as const, message: "Website must be a valid URL" };
    }
  }

  // Only update profile text fields — do not spread user_metadata or avatar_url
  // can be restored from a stale JWT after the user removed their photo.
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: input.full_name.trim(),
      nickname: input.nickname.trim(),
      bio: input.bio.trim(),
      website,
      location: input.location.trim(),
    },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function removeAvatarAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "Not authenticated" };
  }

  // Supabase merges metadata — omitting a key does not remove it; set null explicitly.
  const { error } = await supabase.auth.updateUser({
    data: {
      avatar_url: null,
    },
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false as const, message: "Not authenticated" };
  }

  const hasEmailLogin = user.identities?.some(
    (identity) => identity.provider === "email"
  );

  if (!hasEmailLogin) {
    return {
      ok: false as const,
      message: "Password change is only available for email/password accounts.",
    };
  }

  if (!input.currentPassword.trim()) {
    return { ok: false as const, message: "Enter your current password" };
  }

  if (input.newPassword.length < 8) {
    return {
      ok: false as const,
      message: "New password must be at least 8 characters",
    };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false as const, message: "New passwords do not match" };
  }

  if (input.currentPassword === input.newPassword) {
    return {
      ok: false as const,
      message: "New password must be different from your current password",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });

  if (signInError) {
    return { ok: false as const, message: "Current password is incorrect" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  return { ok: true as const };
}
