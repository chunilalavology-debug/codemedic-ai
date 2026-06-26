"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiModelOption } from "@/lib/ai-models";

export function ModelSettingsForm() {
  const [textModels, setTextModels] = useState<AiModelOption[]>([]);
  const [visionModels, setVisionModels] = useState<AiModelOption[]>([]);
  const [textModel, setTextModel] = useState("");
  const [visionModel, setVisionModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setTextModels(json.textModels ?? []);
          setVisionModels(json.visionModels ?? []);
          setTextModel(json.preferences?.preferredTextModel ?? "");
          setVisionModel(json.preferences?.preferredVisionModel ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredTextModel: textModel,
          preferredVisionModel: visionModel,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("AI models updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Text model (analysis, scan, chat)</Label>
        <Select value={textModel} onValueChange={(v) => v && setTextModel(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {textModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label} — {m.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Vision model (image-to-code)</Label>
        <Select value={visionModel} onValueChange={(v) => v && setVisionModel(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {visionModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save model preferences
      </Button>
    </div>
  );
}
