import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { requireApiUser } from "@/lib/auth/api-auth";
import { resolveTextModel } from "@/lib/ai-models";
import { getUserPreferences } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser("chat");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { message, context, history } = body as {
      message: string;
      context?: { page?: string };
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const prefs = await getUserPreferences(auth.supabase, auth.user.id);
    const model = resolveTextModel(prefs.preferredTextModel);

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: true,
        reply: `I'm CodeMedic AI (demo mode). You're on ${context?.page ?? "the dashboard"}. You asked: "${message.trim()}". Configure GROQ_API_KEY for live AI responses.`,
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const system = `You are CodeMedic AI assistant embedded in a developer platform with tools: Code Analyzer, Site Scanner, Image-to-Code, API Inspector, CI/CD Checker, Activity feed, Workspaces. User is on page: ${context?.page ?? "unknown"}. Be concise, actionable, and helpful.`;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...(history ?? []).slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "No response generated.";

    return NextResponse.json({ success: true, reply, model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
