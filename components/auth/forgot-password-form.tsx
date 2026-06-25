"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/update-password`,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent(true);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-2xl text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="size-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We sent a password reset link to <strong>{email}</strong>. Click the
            link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-2xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send a reset link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-white border-0"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending link…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline">
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
