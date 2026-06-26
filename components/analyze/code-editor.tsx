"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "Paste your code here and describe what changes, fixes, or improvements you want…\n\nExample:\nAdd authentication to this API route\n\n```typescript\nexport async function GET() {\n  // your code\n}\n```";

function getLanguageExtension(lang: string) {
  switch (lang) {
    case "typescript":
      return javascript({ typescript: true });
    case "javascript":
      return javascript();
    case "liquid":
    case "html":
      return html();
    case "css":
      return css();
    case "python":
      return python();
    case "java":
      return java();
    case "cpp":
      return cpp();
    case "php":
      return php();
    case "json":
      return json();
    default:
      return javascript({ typescript: true });
  }
}

function editorHeight(content: string): string {
  const lines = Math.max(content.split("\n").length, 8);
  const clamped = Math.min(Math.max(lines, 8), 28);
  return `${clamped * 1.55 + 2}rem`;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "auto",
  readOnly = false,
  className,
  minHeight,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const extensions = useMemo(
    () => [
      getLanguageExtension(language === "auto" ? "typescript" : language),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "13px" },
        ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
        ".cm-gutters": {
          borderRight: "1px solid oklch(0.5 0.02 22 / 0.12)",
          backgroundColor: "transparent",
        },
        ".cm-activeLineGutter": { backgroundColor: "oklch(0.5 0.24 22 / 0.06)" },
        ".cm-activeLine": { backgroundColor: "oklch(0.5 0.24 22 / 0.04)" },
      }),
    ],
    [language]
  );

  const height = minHeight ?? editorHeight(value);

  return (
    <div
      className={cn(
        "relative overflow-hidden transition-[height] duration-200 ease-out",
        readOnly && "pointer-events-none opacity-95",
        className
      )}
      style={{ height }}
    >
      <CodeMirror
        value={value}
        height={height}
        theme={isDark ? oneDark : "light"}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
        }}
        placeholder={readOnly ? undefined : PLACEHOLDER}
        className="h-full [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:min-h-full"
      />
    </div>
  );
}

export { PLACEHOLDER as CODE_EDITOR_PLACEHOLDER };
