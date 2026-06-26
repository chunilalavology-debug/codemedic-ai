/** Split mixed editor content into code blocks and natural-language instructions. */
export function parseEditorContent(raw: string): {
  code: string;
  instructions?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { code: "" };

  const fenceMatch = trimmed.match(/```[\w.-]*\n([\s\S]*?)```/);
  if (fenceMatch) {
    const code = fenceMatch[1].trim();
    const before = trimmed.slice(0, fenceMatch.index).trim();
    const after = trimmed.slice((fenceMatch.index ?? 0) + fenceMatch[0].length).trim();
    const instructions = [before, after].filter(Boolean).join("\n\n").trim();
    return { code, instructions: instructions || undefined };
  }

  const lines = trimmed.split("\n");
  const instructionLines: string[] = [];
  const codeLines: string[] = [];

  const codeIndicators =
    /^(import |export |const |let |var |function |class |interface |def |fn |pub |package |<\?php|{%|{{|<!DOCTYPE|<html|<div|<section|@media|\.[\w-]+\s*\{|public |private |#include|\{|\}|\[|\]|=>|\);)/;

  let inCodeBlock = false;
  for (const line of lines) {
    const isBlank = !line.trim();
    const looksLikeCode = codeIndicators.test(line.trim()) || inCodeBlock;

    if (looksLikeCode || (codeLines.length > 0 && !isBlank)) {
      inCodeBlock = true;
      codeLines.push(line);
    } else if (!inCodeBlock && line.trim()) {
      instructionLines.push(line);
    } else if (isBlank && codeLines.length > 0) {
      codeLines.push(line);
    } else if (isBlank) {
      instructionLines.push(line);
    }
  }

  if (codeLines.length === 0) {
    return { code: trimmed };
  }

  const trailingInstructions: string[] = [];
  while (codeLines.length > 0) {
    const last = codeLines[codeLines.length - 1];
    if (!last.trim()) {
      codeLines.pop();
      continue;
    }
    if (!codeIndicators.test(last.trim()) && last.trim().length < 120 && !/[{}();=<>]/.test(last)) {
      trailingInstructions.unshift(codeLines.pop()!);
    } else {
      break;
    }
  }

  const code = codeLines.join("\n").trim();
  const instructions = [...instructionLines, ...trailingInstructions]
    .join("\n")
    .trim();

  return {
    code: code || trimmed,
    instructions: instructions || undefined,
  };
}
