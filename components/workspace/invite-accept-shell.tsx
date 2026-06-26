"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InviteAcceptShellProps {
  token: string;
}

export function InviteAcceptShell({ token }: InviteAcceptShellProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    email: string;
    role: string;
    workspaceName: string;
  } | null>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  useEffect(() => {
    fetch(`/api/workspaces/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error ?? "Invalid invitation");
          return;
        }
        setInfo(json.invitation);
      })
      .catch(() => setError("Failed to load invitation"))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/workspaces/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=/invite/${token}`);
        return;
      }
      if (!json.success) throw new Error(json.error);
      toast.success("Welcome to the workspace!");
      router.push("/overview");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Workspace invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-start gap-2 text-destructive text-sm">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              {error}
            </div>
          ) : info ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You&apos;ve been invited to join{" "}
                <strong className="text-foreground">{info.workspaceName}</strong> as{" "}
                <strong className="text-foreground capitalize">{info.role}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Invitation sent to: {info.email}
              </p>
              <Button
                onClick={accept}
                disabled={accepting || signedIn === false}
                className="w-full gap-2"
              >
                {accepting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Accept invitation
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Not signed in?{" "}
                <Link href={`/login?next=/invite/${token}`} className="text-primary underline">
                  Sign in first
                </Link>
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
