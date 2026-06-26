import type { Language } from "@/types";

export const ANALYZER_LANGUAGES: { value: string; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "liquid", label: "Shopify Liquid" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "json", label: "JSON" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

export const LANGUAGE_PROMPT_LIST =
  "liquid|html|css|javascript|typescript|python|java|cpp|php|json|rust|go|csharp|ruby|swift|kotlin|unknown";

export const FILE_ACCEPT =
  ".liquid,.html,.htm,.css,.scss,.ts,.tsx,.js,.jsx,.mjs,.py,.java,.cpp,.cc,.h,.php,.json,.rs,.go,.cs,.rb,.swift,.kt,.txt";

export const SYNTAX_LANG_MAP: Record<string, string> = {
  liquid: "markup",
  html: "markup",
  css: "css",
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  php: "php",
  json: "json",
  rust: "rust",
  go: "go",
  csharp: "csharp",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  unknown: "text",
};

export const EXT_TO_LANGUAGE: Record<string, Language> = {
  liquid: "liquid",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  cs: "csharp",
  php: "php",
  json: "json",
  rs: "rust",
  go: "go",
  rb: "ruby",
  swift: "swift",
  kt: "kotlin",
};
