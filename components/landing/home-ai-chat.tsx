"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "codemedic-landing-chat-v1";

const SUGGESTED_PROMPTS = [
  "How does the AI code analyzer work?",
  "Can you scan my GitHub repo for issues?",
  "What languages do you support?",
  "How do I convert a screenshot to code?",
];

export function HomeAiChat() {
  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages, hydrated]);

  useEffect(() => {
    if (expanded) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, expanded]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      if (!expanded) setExpanded(true);

      try {
        const res = await fetch("/api/chat/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
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
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              err instanceof Error
                ? err.message
                : "Something went wrong. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [expanded, input, loading, messages]
  );

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section id="ai-assistant" className="px-4 py-16 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <div className="text-center mb-8">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs"
          >
            <Sparkles className="size-3 mr-1.5" />
            Try it live
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ask{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #f87171 0%, #fb923c 55%, #fbbf24 100%)",
              }}
            >
              CodeMedic AI
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-base sm:text-lg">
            Chat with our AI assistant — get instant answers about code analysis, scanning, and
            platform features.
          </p>
        </div>

        {/* Chat card */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-primary/5 transition-all duration-300",
            "ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
          )}
        >
          {/* Top gradient accent */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.58 0.22 38 / 0.6), transparent)",
            }}
          />

          {/* Chat header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 sm:px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-sm">
                <Bot className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  CodeMedic Assistant
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {loading ? "Typing…" : "Online · Demo mode"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  onClick={clearHistory}
                  aria-label="Clear conversation"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Collapse chat" : "Expand chat"}
              >
                {expanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className={cn(
              "overflow-hidden transition-[max-height] duration-300 ease-in-out",
              expanded ? "max-h-[min(420px,60vh)]" : "max-h-0"
            )}
          >
            <div className="overflow-y-auto scrollbar-thin px-4 sm:px-5 py-4 space-y-4 min-h-[220px] max-h-[min(420px,60vh)]">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15">
                    <MessageSquare className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Start a conversation
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Ask about code fixes, site scans, supported languages, or how to get started.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2.5",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                      <Bot className="size-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] sm:max-w-[78%]",
                      m.role === "user"
                        ? "gradient-primary text-white rounded-br-md shadow-sm"
                        : "bg-muted/80 text-foreground border border-border/50 rounded-bl-md"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-muted/80 border border-border/50 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested prompts */}
          {expanded && messages.length === 0 && (
            <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={loading}
                  className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/60 p-3 sm:p-4 bg-muted/10">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask anything about CodeMedic AI…"
                disabled={loading}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm",
                  "outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40",
                  "placeholder:text-muted-foreground/70 min-h-[44px] max-h-28",
                  "disabled:opacity-60"
                )}
              />
              <Button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                size="icon"
                className="size-11 shrink-0 rounded-xl gradient-primary text-white border-0 shadow-sm"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              Free demo ·{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>{" "}
              for full AI tools & saved history
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
