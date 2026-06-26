"use client";

import { useEffect, useState } from "react";
import { GitBranch, Loader2, Mail, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspaceRole } from "@/lib/workspace";

interface WorkspaceShellProps {
  user: SupabaseUser | null;
}

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

export function WorkspaceShell({ user }: WorkspaceShellProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [glToken, setGlToken] = useState("");
  const [integrations, setIntegrations] = useState<{ provider: string; account_login: string | null }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [wsRes, intRes, prefRes] = await Promise.all([
          fetch("/api/workspaces"),
          fetch("/api/integrations"),
          fetch("/api/preferences"),
        ]);
        const wsJson = await wsRes.json();
        const intJson = await intRes.json();
        const prefJson = await prefRes.json();
        if (wsJson.success) {
          const list: WorkspaceItem[] = wsJson.data ?? [];
          setWorkspaces(list);
          const prefId = prefJson.success ? prefJson.preferences?.activeWorkspaceId : null;
          const validId =
            prefId && list.some((w) => w.id === prefId) ? prefId : (list[0]?.id ?? "");
          setActiveId(validId);
        }
        if (intJson.success) setIntegrations(intJson.data ?? []);
      } catch {
        toast.error("Failed to load workspace data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  async function switchWorkspace(id: string) {
    setActiveId(id);
    await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeWorkspaceId: id }),
    });
    toast.success("Workspace switched");
  }

  async function invite() {
    if (!active || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: active.id,
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (json.emailSent) {
        toast.success(`Invitation email sent to ${inviteEmail}`);
      } else {
        toast.success(`Invitation created — share link copied`);
        if (json.inviteUrl) {
          await navigator.clipboard.writeText(json.inviteUrl);
        }
      }
      setInviteEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  async function saveIntegration(provider: "github" | "gitlab", token: string) {
    if (!token.trim()) return;
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, accessToken: token.trim() }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error ?? "Failed to save token");
      return;
    }
    toast.success(`${provider} connected`);
    setGhToken("");
    setGlToken("");
    const intRes = await fetch("/api/integrations");
    const intJson = await intRes.json();
    if (intJson.success) setIntegrations(intJson.data ?? []);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Workspace & Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage teams, invites, and private repo access for {user?.email}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4" /> Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Run <code className="text-xs">supabase/schema-v2.sql</code> to enable workspaces.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Active workspace</Label>
                <Select value={active?.id ?? ""} onValueChange={(v) => v && switchWorkspace(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {active && (
                <div className="flex gap-2">
                  <Badge variant="outline">{active.slug}</Badge>
                  <Badge className="capitalize">{active.role}</Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {active && (active.role === "owner" || active.role === "admin") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="size-4" /> Invite member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={inviting || !inviteEmail.trim()} className="gap-2">
              {inviting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Send invite
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="size-4" /> Private repo tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Tokens are stored securely in your account (server-side). Used for private GitHub/GitLab scans.
          </p>
          {integrations.map((i) => (
            <div key={i.provider} className="flex items-center gap-2 text-sm">
              <Shield className="size-4 text-green-500" />
              <span className="capitalize">{i.provider}</span>
              {i.account_login && <span className="text-muted-foreground">@{i.account_login}</span>}
              <Badge variant="secondary" className="text-[10px]">Connected</Badge>
            </div>
          ))}
          <div className="space-y-2">
            <Label>GitHub personal access token</Label>
            <div className="flex gap-2">
              <Input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_..." />
              <Button variant="outline" onClick={() => saveIntegration("github", ghToken)}>Save</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>GitLab personal access token</Label>
            <div className="flex gap-2">
              <Input type="password" value={glToken} onChange={(e) => setGlToken(e.target.value)} placeholder="glpat-..." />
              <Button variant="outline" onClick={() => saveIntegration("gitlab", glToken)}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
