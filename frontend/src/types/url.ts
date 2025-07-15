// URL Status types
export type UrlStatus =
  | "queued"
  | "pending"
  | "processing"
  | "completed"
  | "error"
  | "unknown";

// Main URL interface
export interface Url {
  id: number;
  url: string;
  title: string | null;
  status: UrlStatus;
  html_version: string | null;
  internal_links: number;
  external_links: number;
  broken_links: number;
  has_login_form: boolean;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  created_at: string;
  updated_at: string;
  analyzed_at?: string | null;
}

// Analysis result interface (detailed view)
export interface AnalysisResult {
  id: number;
  url: string;
  title: string | null;
  status: UrlStatus;
  html_version: string | null;
  internal_links: number;
  external_links: number;
  broken_links: number;
  has_login_form: boolean;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
  };
  broken_links_details: BrokenLink[];
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Broken link interface
export interface BrokenLink {
  url: string;
  status_code: number;
  error: string;
}

// API Request types
export interface CreateUrlRequest {
  url: string;
}

// API Response types
export interface UrlsResponse {
  urls: Url[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UrlResponse {
  id: number;
  url: string;
  status: UrlStatus;
  created_at: string;
  updated_at?: string;
}

// Query parameters for listing URLs
export interface UrlsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UrlStatus;
}

// URL action result (for start/stop analysis)
export interface UrlActionResponse {
  id: number;
  url: string;
  status: UrlStatus;
  updated_at: string;
}

// Common API response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

// UI-specific types
export interface UrlTableFilters {
  search: string;
  status: UrlStatus | "all";
  page: number;
  limit: number;
}

export interface UrlStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  error: number;

  // Enhanced stats
  successRate: number; // Percentage of completed vs total analyzed
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: number;
  url: string;
  action: "added" | "completed" | "failed" | "started";
  timestamp: string;
  status: UrlStatus;
}

export interface TrendData {
  value: number;
  change: number; // Percentage change
  isUpward: boolean;
  period: string; // e.g., "vs last week"
}

// Bulk action types
export type BulkAction = "delete" | "analyze" | "stop" | "rerun";

export interface BulkActionRequest {
  action: BulkAction;
  urlIds: number[];
}

export interface BulkActionResponse {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
}
