export type ExportFormat = "json" | "csv" | "pdf";

export interface ExportPayload {
  title: string;
  generatedAt: string;
  type: string;
  data: Record<string, unknown>;
}

export function exportAsJson(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function exportAsCsv(payload: ExportPayload): string {
  const rows: string[][] = [["Field", "Value"]];
  rows.push(["Title", payload.title]);
  rows.push(["Type", payload.type]);
  rows.push(["Generated", payload.generatedAt]);

  function flatten(obj: Record<string, unknown>, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, path);
      } else {
        rows.push([path, String(value ?? "")]);
      }
    }
  }

  flatten(payload.data);
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

/** Minimal PDF — text-based for server-side export without heavy deps */
export function exportAsPdfText(payload: ExportPayload): string {
  const lines = [
    "CodeMedic AI Report",
    "===================",
    "",
    `Title: ${payload.title}`,
    `Type: ${payload.type}`,
    `Generated: ${payload.generatedAt}`,
    "",
    JSON.stringify(payload.data, null, 2),
  ];
  return lines.join("\n");
}

export function getExportFilename(title: string, format: ExportFormat): string {
  const safe = title.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40);
  const ext = format === "pdf" ? "pdf.txt" : format;
  return `codemedic-${safe}-${Date.now()}.${ext}`;
}

export function getExportContentType(format: ExportFormat): string {
  switch (format) {
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "pdf":
      return "text/plain";
  }
}
