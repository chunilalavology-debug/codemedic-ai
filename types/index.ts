export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "rust"
  | "go"
  | "java"
  | "cpp"
  | "csharp"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "unknown";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type AnalysisType = "error" | "security" | "performance" | "all";

export interface CodeError {
  line?: number;
  column?: number;
  message: string;
  type: string;
}

export interface SecurityIssue {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  line?: number;
  recommendation: string;
  cweId?: string;
}

export interface PerformanceIssue {
  id: string;
  title: string;
  impact: "high" | "medium" | "low";
  description: string;
  line?: number;
  recommendation: string;
  estimatedGain?: string;
}

export interface AnalysisResult {
  id: string;
  language: Language;
  explanation: string;
  rootCause: string;
  fixedCode: string;
  diff: DiffLine[];
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
  errors: CodeError[];
  confidence: number;
  analysisType: AnalysisType;
  createdAt: string;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: number;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  title: string;
  originalCode: string;
  errorMessage?: string;
  language: Language;
  result: AnalysisResult;
  analysisType: AnalysisType;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeRequest {
  code: string;
  errorMessage?: string;
  language?: Language;
  analysisType: AnalysisType;
  fileName?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: AnalysisRecord[];
  error?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UploadedFile {
  name: string;
  content: string;
  language: Language;
  size: number;
}

export type Theme = "light" | "dark" | "system";
