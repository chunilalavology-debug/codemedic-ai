"use client";

import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials, getUserProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User | null;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "default" | "lg";
}

export function UserAvatar({
  user,
  className,
  fallbackClassName,
  size = "default",
}: UserAvatarProps) {
  const { avatarUrl } = getUserProfile(user);
  const initials = getUserInitials(user);

  return (
    <Avatar size={size} className={className}>
      {avatarUrl ? (
        <AvatarImage
          key={avatarUrl}
          src={avatarUrl}
          alt={getUserProfile(user).displayName}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-primary/15 text-primary text-xs font-semibold",
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
