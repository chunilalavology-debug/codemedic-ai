"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  removeAvatarAction,
  updateProfileAction,
} from "@/lib/auth/profile-actions";
import { compressAvatarFile } from "@/lib/avatar-compress";
import { getUserInitials, getUserProfile } from "@/lib/profile";

interface ProfileFormProps {
  user: SupabaseUser | null;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = getUserProfile(user);

  const [fullName, setFullName] = useState(profile.fullName);
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [website, setWebsite] = useState(profile.website);
  const [location, setLocation] = useState(profile.location);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Use JPG, PNG, WebP, or GIF");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressed = await compressAvatarFile(file);
      const formData = new FormData();
      formData.append("avatar", compressed);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Upload failed");
      }

      setAvatarUrl(json.avatar_url);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleRemoveAvatar() {
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setAvatarUrl(null);
      toast.success("Profile photo removed");
      router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction({
        full_name: fullName,
        nickname,
        bio,
        website,
        location,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Profile updated");
      router.refresh();
    });
  }

  const initials = getUserInitials(user);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <Avatar className="size-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={nickname || fullName || "Profile"} /> : null}
            <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            disabled={uploadingAvatar || isPending}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Change profile photo"
          >
            {uploadingAvatar ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleAvatarChange(e.target.files?.[0])}
          />
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upload a JPG, PNG, WebP, or GIF. Max 2 MB (auto-compressed for your profile).
          </p>
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={uploadingAvatar || isPending}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              Remove photo
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Shashi Thakur"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Your display name"
            maxLength={40}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a little about yourself..."
          maxLength={280}
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground">{bio.length}/280</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, Country"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            maxLength={200}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email address</p>
            <p className="text-sm font-medium text-foreground">
              {user?.email ?? "—"}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {user?.email_confirmed_at ? "Verified" : "Unverified"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account created</p>
            <p className="text-sm font-medium text-foreground">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/40">
            Active
          </Badge>
        </div>
      </div>

      <Button type="submit" disabled={isPending || uploadingAvatar} className="gap-2">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
