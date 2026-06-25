import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";
import { requireApiUser } from "@/lib/auth/api-auth";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const frameworkPrompts: Record<string, string> = {
  html: "Generate clean semantic HTML5 with inline CSS or a <style> block. Use modern CSS (flexbox/grid). No frameworks.",
  react: "Generate a React functional component with TypeScript. Use CSS modules or styled-components syntax in a comment. Export as default.",
  nextjs: "Generate a Next.js page component with TypeScript. Use Tailwind CSS classes. Export as default.",
  vue: "Generate a Vue 3 single-file component with <template>, <script setup lang='ts'>, and <style scoped>.",
  tailwind: "Generate HTML with Tailwind CSS utility classes. Use the official Tailwind CDN approach.",
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const framework = (formData.get("framework") as string) ?? "react";
    const mode = (formData.get("mode") as string) ?? "component";

    if (!file) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Image must be under 5MB" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: true, data: getMockResult(framework, mode) });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const modeDesc = mode === "page" ? "a full page layout" : "a reusable UI component";

    const prompt = `You are an expert frontend developer. Analyze this UI design image and generate ${modeDesc}.

Framework: ${framework.toUpperCase()}
Instructions: ${frameworkPrompts[framework] ?? frameworkPrompts.react}

Requirements:
1. Accurately replicate the layout, spacing, typography, and colors from the image
2. Make it responsive (mobile-first)
3. Use semantic HTML where applicable
4. Include all visible text content
5. Add hover states for interactive elements

Return ONLY valid JSON (no markdown fences):
{
  "code": "the complete code as a single string",
  "explanation": "2-3 sentences describing what was built and key design decisions",
  "components": ["list of reusable components identified in the design"]
}`;

    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    });

    const raw = (response.choices[0]?.message?.content ?? "")
      .replace(/```json|```/g, "")
      .trim();

    let parsed: { code: string; explanation: string; components: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If JSON parsing fails, treat entire response as code
      parsed = {
        code: raw,
        explanation: "Generated from the provided UI design image.",
        components: [],
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        id: uuidv4(),
        framework,
        mode,
        code: parsed.code ?? "",
        explanation: parsed.explanation ?? "",
        components: parsed.components ?? [],
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image processing failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function getMockResult(framework: string, mode: string) {
  const code = framework === "react" || framework === "nextjs"
    ? `import React from 'react';

interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export default function Card({ title, description, imageUrl }: CardProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white max-w-sm">
      {imageUrl && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        <p className="text-gray-500 text-sm mt-1 leading-relaxed">{description}</p>
        <button className="mt-4 w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
}`
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UI Component</title>
  <style>
    .card { border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; max-width: 360px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .card-body { padding: 20px; }
    .card-title { font-size: 1.1rem; font-weight: 600; color: #111827; }
    .card-desc { color: #6b7280; font-size: .9rem; margin-top: 4px; }
    .btn { width: 100%; margin-top: 16px; padding: 8px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-body">
      <h3 class="card-title">Card Component</h3>
      <p class="card-desc">A reusable card component generated from your design.</p>
      <button class="btn">Learn More</button>
    </div>
  </div>
</body>
</html>`;

  return {
    id: uuidv4(),
    framework,
    mode,
    code,
    explanation: `Generated a ${mode === "page" ? "full page" : "reusable component"} in ${framework.toUpperCase()}. This is a mock result — set GROQ_API_KEY to enable real vision AI.`,
    components: ["Card", "Button"],
    createdAt: new Date().toISOString(),
  };
}
