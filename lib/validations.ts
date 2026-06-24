import type { AnalyzeRequest } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateAnalyzeRequest(body: unknown): {
  data?: AnalyzeRequest;
  errors?: ValidationError[];
} {
  if (!body || typeof body !== "object") {
    return { errors: [{ field: "body", message: "Request body must be an object" }] };
  }

  const req = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (!req.code || typeof req.code !== "string" || req.code.trim().length === 0) {
    errors.push({ field: "code", message: "Code is required" });
  } else if (req.code.length > 100_000) {
    errors.push({ field: "code", message: "Code must be under 100,000 characters" });
  }

  if (req.errorMessage !== undefined && typeof req.errorMessage !== "string") {
    errors.push({ field: "errorMessage", message: "Error message must be a string" });
  }

  const validTypes = ["error", "security", "performance", "all"];
  if (!req.analysisType || !validTypes.includes(req.analysisType as string)) {
    errors.push({ field: "analysisType", message: `analysisType must be one of: ${validTypes.join(", ")}` });
  }

  if (errors.length > 0) return { errors };

  return {
    data: {
      code: (req.code as string).trim(),
      errorMessage: req.errorMessage as string | undefined,
      language: req.language as AnalyzeRequest["language"],
      analysisType: req.analysisType as AnalyzeRequest["analysisType"],
      fileName: req.fileName as string | undefined,
    },
  };
}
