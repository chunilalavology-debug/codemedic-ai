import { describe, it, expect } from "vitest";
import { parseEditorContent } from "@/lib/analyze-content";

describe("parseEditorContent", () => {
  it("extracts code from fenced blocks and instructions outside", () => {
    const input = `Add authentication to this route

\`\`\`typescript
export async function GET() {
  return Response.json({ ok: true });
}
\`\`\`

Also handle errors gracefully`;

    const { code, instructions } = parseEditorContent(input);
    expect(code).toContain("export async function GET");
    expect(instructions).toContain("Add authentication");
    expect(instructions).toContain("handle errors");
  });

  it("returns full content as code when no structure detected", () => {
    const input = "const x = 1;\nconsole.log(x);";
    const { code, instructions } = parseEditorContent(input);
    expect(code).toBe(input);
    expect(instructions).toBeUndefined();
  });

  it("handles empty input", () => {
    expect(parseEditorContent("")).toEqual({ code: "" });
  });
});
