import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { checkRateLimit } from "@/lib/rate-limit";
import { DEFAULT_TEXT_MODEL } from "@/lib/ai-models";

function sanitizeHistory(
  history?: { role: string; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  return (history ?? [])
    .slice(-6)
    .filter(
      (item): item is { role: "user" | "assistant"; content: string } =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0 &&
        item.content.length <= 2000
    )
    .map((item) => ({ role: item.role, content: item.content.trim() }));
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    const limited = checkRateLimit(`chat-demo:${ip}`);
    if (limited) return limited;

    let body: { message?: string; history?: { role: string; content: string }[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ success: false, error: "Message too long" }, { status: 400 });
    }

    const history = sanitizeHistory(body.history);

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        success: true,
        reply: `Thanks for trying CodeMedic AI! You asked: "${message.slice(0, 120)}${message.length > 120 ? "…" : ""}". Sign up free to unlock full AI analysis, code fixes, site scans, and more.`,
        demo: true,
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const system = `You are CodeMedic AI — a friendly developer assistant on the landing page demo. Help visitors understand the platform: code analysis, website/repo scanning, image-to-code, API inspector, CI/CD checker, workspaces. Be concise (2-4 sentences), actionable, and encourage signing up for the full experience. Do not invent features that don't exist.`;

    const completion = await groq.chat.completions.create({
      model: DEFAULT_TEXT_MODEL,
      messages: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.5,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm here to help! Ask about code analysis, scanning, or any CodeMedic AI feature.";

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
