"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Bot, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_FAQ, findFaqMatch, type FaqItem } from "@/lib/landing-faq";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = LANDING_FAQ.slice(0, 5).map((f) => f.question);

export function HomeFaqWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function replyForQuestion(item: FaqItem) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: item.question },
      { id: crypto.randomUUID(), role: "assistant", content: item.answer },
    ]);
  }

  function handleAsk(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;

    const match = findFaqMatch(q);
    const answer = match
      ? match.answer
      : "I don't have a specific answer for that yet. Try one of the suggested questions below, browse the FAQ section, or sign up to chat with our full AI assistant.";

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: q },
      { id: crypto.randomUUID(), role: "assistant", content: answer },
    ]);
    setInput("");
  }

  return (
    <>
      {/* Floating panel */}
      <div
        className={cn(
          "fixed bottom-20 right-4 sm:right-6 z-[100] w-[min(100vw-2rem,380px)] transition-all duration-300 origin-bottom-right",
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] max-h-[min(520px,calc(100vh-6rem))]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
                <Bot className="size-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">CodeMedic Help</p>
                <p className="text-[11px] text-muted-foreground">Common questions</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Close help chat"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.length === 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-xs text-muted-foreground leading-relaxed px-1">
                  Hi! 👋 Pick a question or type your own — instant answers about
                  CodeMedic AI.
                </p>
                <div className="space-y-1.5">
                  {QUICK_QUESTIONS.map((q) => {
                    const item = LANDING_FAQ.find((f) => f.question === q)!;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => replyForQuestion(item)}
                        className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-left text-xs text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        <ChevronRight className="size-3 shrink-0 text-primary" />
                        <span className="line-clamp-2">{q}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[90%]",
                      m.role === "user"
                        ? "gradient-primary text-white rounded-br-md"
                        : "bg-muted/80 text-foreground border border-border/50 rounded-bl-md"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* More questions when chatting */}
          {messages.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
              {LANDING_FAQ.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => replyForQuestion(item)}
                  className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {item.question.split(" ").slice(0, 4).join(" ")}…
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/60 p-3 bg-muted/10">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask a question…"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              />
              <Button
                size="icon"
                className="size-9 shrink-0 rounded-lg gradient-primary text-white border-0"
                onClick={() => handleAsk()}
                disabled={!input.trim()}
                aria-label="Send"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-center text-muted-foreground">
              Need AI help?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-[100] flex size-14 items-center justify-center rounded-full gradient-primary text-white shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95",
          open && "rotate-0"
        )}
        aria-label={open ? "Close help chat" : "Open help chat"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
