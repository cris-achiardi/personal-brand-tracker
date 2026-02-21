// ── Aggregate report (Contenido_*.xlsx) ─────────────────────────────────────

export interface AggregateDiscovery {
  periodStart: string; // "2025-08-21"
  periodEnd: string;
  totalImpressions: number;
  totalMembersReached: number;
}

export interface DailyEngagement {
  date: string; // "2025-08-21"
  impressions: number;
  interactions: number;
}

export interface FollowersSummary {
  totalFollowers: number;
  daily: { date: string; newFollowers: number }[];
}

export interface DemographicRow {
  category: DemographicCategory;
  value: string;
  percentage: number;
}

export type DemographicCategory =
  | "job_title"
  | "location"
  | "industry"
  | "seniority"
  | "company_size"
  | "company";

export interface AggregateReport {
  discovery: AggregateDiscovery;
  dailyEngagement: DailyEngagement[];
  followers: FollowersSummary;
  demographics: DemographicRow[];
}

// ── Per-post report (PostAnalytics_*.xlsx) ──────────────────────────────────

export interface LinkClick {
  url: string;
  clicks: number;
}

export interface EngagementHighlight {
  engagementType: "reaction" | "comment" | "share";
  periodStart: string | null;
  periodEnd: string | null;
  topJobTitle: string | null;
  topLocation: string | null;
  topIndustry: string | null;
}

export interface PostPerformance {
  url: string;
  platformId: string;
  publishedAt: string;
  publishedTime: string | null;
  impressions: number;
  membersReached: number;
  linkClicks: LinkClick[];
  profileViewsFromPost: number;
  followersFromPost: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  sends: number;
  videoViews: number | null;
  videoWatchTimeSeconds: number | null;
  videoAvgWatchSeconds: number | null;
  engagementHighlights: EngagementHighlight[];
}

export interface PostReport {
  performance: PostPerformance;
  demographics: DemographicRow[];
}
