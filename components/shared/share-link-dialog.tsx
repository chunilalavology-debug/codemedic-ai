"use client";

import { useState } from "react";
import { Copy, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string;
  resourceData: Record<string, unknown>;
  resourceId?: string;
  title: string;
}

export function ShareLinkDialog({
  open,
  onOpenChange,
  resourceType,
  resourceData,
  resourceId,
  title,
}: ShareLinkDialogProps) {
  const [expiryDays, setExpiryDays] = useState("7");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          resourceData,
          title,
          expiryDays: expiryDays ? Number(expiryDays) : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create link");
      setShareUrl(json.url);
      toast.success("Share link created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" /> Share report
          </DialogTitle>
          <DialogDescription>
            Generate a public read-only link. Anyone with the link can view this report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Expires in (days, empty = never)</Label>
            <Input
              id="expiry"
              type="number"
              min={1}
              max={365}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
            />
          </div>

          {shareUrl ? (
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copy}>
                <Copy className="size-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={generate} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Generate link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
