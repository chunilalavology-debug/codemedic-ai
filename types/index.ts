export type Language =
  | "liquid"
  | "html"
  | "css"
  | "typescript"
  | "javascript"
  | "python"
  | "rust"
  | "go"
  | "java"
  | "cpp"
  | "csharp"
  | "php"
  | "json"
  | "ruby"
  | "swift"
  | "kotlin"
  | "unknown";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AnalysisType = "error" | "security" | "performance" | "all";
export type Impact = "high" | "medium" | "low";

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
  impact: Impact;
  description: string;
  line?: number;
  recommendation: string;
  estimatedGain?: string;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: number;
}

export interface CodeSmell {
  id: string;
  title: string;
  description: string;
  line?: number;
  recommendation: string;
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
  codeSmells?: CodeSmell[];
  improvements?: string[];
  optimizedCode?: string;
  confidence: number;
  qualityScore?: number;
  analysisType: AnalysisType;
  createdAt: string;
}

export interface AnalyzeFollowUpMessage {
  role: "user" | "assistant";
  content: string;
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
  userInstructions?: string;
  language?: Language;
  analysisType: AnalysisType;
  fileName?: string;
  followUpMessages?: AnalyzeFollowUpMessage[];
  previousFixedCode?: string;
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

// ─── Scanner Types ──────────────────────────────────────────────────────────

export type ScanType = "website" | "github" | "gitlab";

export type ScanCategory =
  | "code"
  | "performance"
  | "security"
  | "seo"
  | "accessibility"
  | "accessible"
  | "broken"
  | "dependency"
  | "responsive";

export interface ScanIssue {
  id: string;
  category: ScanCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  location?: string;
}

export interface SeoMetrics {
  title: string | null;
  description: string | null;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasRobots: boolean;
  hasSitemap: boolean | null;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasStructuredData: boolean;
  headings: { level: number; text: string }[];
  images: { src: string; hasAlt: boolean }[];
  linkCount: number;
  wordCount: number;
}

export interface ScanScores {
  overall: number;
  performance: number;
  seo: number;
  accessibility: number;
  security: number;
  maintainability: number;
}

export interface ScanResult {
  id: string;
  url: string;
  type: ScanType;
  title: string;
  scores: ScanScores;
  issues: ScanIssue[];
  seoMetrics?: SeoMetrics;
  summary: string;
  recommendations: string[];
  techStack?: string[];
  createdAt: string;
}

export interface ScanResponse {
  success: boolean;
  data?: ScanResult;
  error?: string;
}

// ─── Image → Code Types ──────────────────────────────────────────────────────

export type UIFramework = "html" | "react" | "nextjs" | "vue" | "tailwind";
export type CodeMode = "component" | "page";

export interface ImageToCodeResult {
  id: string;
  framework: UIFramework;
  mode: CodeMode;
  code: string;
  explanation: string;
  components: string[];
  createdAt: string;
}

export interface ImageToCodeResponse {
  success: boolean;
  data?: ImageToCodeResult;
  error?: string;
}

// ─── API Inspector Types ─────────────────────────────────────────────────────

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface ApiTestRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  auth?: { type: "bearer" | "basic" | "none"; value?: string };
}

export interface ApiTestResult {
  id: string;
  url: string;
  method: HttpMethod;
  status: number;
  statusText: string;
  latency: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  size: number;
  success: boolean;
  issues: string[];
  curlCommand: string;
  fetchCode: string;
  axiosCode: string;
  createdAt: string;
}

export interface ApiTestResponse {
  success: boolean;
  data?: ApiTestResult;
  error?: string;
}
