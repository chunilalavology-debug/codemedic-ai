import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  fullName: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  website: string;
  location: string;
}

export function getUserProfile(user: User | null): UserProfile {
  const meta = user?.user_metadata ?? {};
  const fullName = typeof meta.full_name === "string" ? meta.full_name : "";
  const nickname = typeof meta.nickname === "string" ? meta.nickname : "";
  const displayName =
    nickname ||
    fullName ||
    user?.email?.split("@")[0] ||
    "Account";

  return {
    fullName,
    nickname,
    displayName,
    avatarUrl:
      typeof meta.avatar_url === "string" && meta.avatar_url.trim()
        ? meta.avatar_url
        : null,
    bio: typeof meta.bio === "string" ? meta.bio : "",
    website: typeof meta.website === "string" ? meta.website : "",
    location: typeof meta.location === "string" ? meta.location : "",
  };
}

export function getUserInitials(user: User | null): string {
  const { displayName } = getUserProfile(user);

  if (displayName && displayName !== "Account") {
    return displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return user?.email?.[0]?.toUpperCase() ?? "U";
}
