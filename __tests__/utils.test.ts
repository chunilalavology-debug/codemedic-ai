import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  formatBytes,
  extractTitle,
  truncateCode,
  cn,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("deduplicates tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("detectLanguage", () => {
  it("detects from .ts extension", () => {
    expect(detectLanguage("", "index.ts")).toBe("typescript");
  });
  it("detects from .tsx extension", () => {
    expect(detectLanguage("", "App.tsx")).toBe("typescript");
  });
  it("detects from .py extension", () => {
    expect(detectLanguage("", "script.py")).toBe("python");
  });
  it("detects from .rs extension", () => {
    expect(detectLanguage("", "main.rs")).toBe("rust");
  });
  it("detects from .go extension", () => {
    expect(detectLanguage("", "main.go")).toBe("go");
  });
  it("detects from .java extension", () => {
    expect(detectLanguage("", "Main.java")).toBe("java");
  });
  it("detects typescript from code pattern", () => {
    expect(detectLanguage("interface Foo { bar: string }")).toBe("typescript");
  });
  it("detects python from code pattern", () => {
    expect(detectLanguage("def hello():\n  print('hi')")).toBe("python");
  });
  it("returns unknown for unrecognised code", () => {
    expect(detectLanguage("lorem ipsum dolor sit amet")).toBe("unknown");
  });
  it("detects liquid from .liquid extension", () => {
    expect(detectLanguage("", "section.liquid")).toBe("liquid");
  });
  it("detects liquid from tags", () => {
    expect(detectLanguage("{% schema %}\n{ \"name\": \"Hero\" }\n{% endschema %}")).toBe("liquid");
  });
  it("detects html from doctype", () => {
    expect(detectLanguage("<!DOCTYPE html>\n<html><body></body></html>")).toBe("html");
  });
  it("detects json from structure", () => {
    expect(detectLanguage('{\n  "name": "test"\n}')).toBe("json");
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats kilobytes", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
  it("formats megabytes", () => {
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

describe("extractTitle", () => {
  it("returns fileName if provided", () => {
    expect(extractTitle("const x = 1", "app.ts")).toBe("app.ts");
  });
  it("extracts function name", () => {
    expect(extractTitle("function myFunc() {}")).toBe("myFunc");
  });
  it("extracts class name", () => {
    expect(extractTitle("class MyClass {}")).toBe("MyClass");
  });
  it("returns Untitled Analysis for plain code", () => {
    expect(extractTitle("const x = 1 + 2")).toBe("Untitled Analysis");
  });
});

describe("truncateCode", () => {
  it("returns full code when under limit", () => {
    const code = "line1\nline2\nline3";
    expect(truncateCode(code, 5)).toBe(code);
  });
  it("truncates and adds suffix when over limit", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line${i + 1}`);
    const result = truncateCode(lines.join("\n"), 5);
    expect(result).toContain("5 more lines");
    expect(result.split("\n").length).toBe(6); // 5 lines + truncation line
  });
});
