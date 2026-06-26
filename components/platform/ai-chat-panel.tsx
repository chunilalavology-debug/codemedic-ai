"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { usePlatform } from "@/lib/platform-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/platform";

export function AiChatPanel() {
  const { chatOpen, closeChat } = usePlatform();
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: { page: pathname },
          history: messages.slice(-6),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Chat failed");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: json.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  if (!chatOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[150] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span className="text-sm font-semibold">CodeMedic AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={closeChat} aria-label="Close chat">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ask anything about code analysis, scans, API testing, or how to use this platform.
            I&apos;m context-aware of your current page: <strong>{pathname}</strong>
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-lg px-3 py-2 text-sm leading-relaxed max-w-[95%]",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask CodeMedic AI…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" aria-label="Send">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
