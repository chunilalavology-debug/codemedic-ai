export type WorkspaceRole = "owner" | "admin" | "member";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ShareLinkRecord {
  id: string;
  token: string;
  resourceType: string;
  resourceId?: string;
  expiresAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface CicdCheckResult {
  provider: string;
  files: string[];
  score: number;
  issues: {
    id: string;
    severity: "error" | "warning" | "info";
    title: string;
    description: string;
    file?: string;
    line?: number;
  }[];
  summary: string;
}

export interface CommandItem {
  id: string;
  label: string;
  href?: string;
  action?: string;
  keywords?: string[];
  group: string;
}

export interface ApiHealthMetrics {
  avgLatency: number;
  successRate: number;
  lastStatus: number;
  requestCount: number;
}
