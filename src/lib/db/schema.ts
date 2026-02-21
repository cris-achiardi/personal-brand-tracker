import {
  pgSchema,
  uuid,
  text,
  integer,
  real,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const brandTracker = pgSchema("brand_tracker");

// ── profiles ────────────────────────────────────────────────────────────────
// One row per platform (e.g. "linkedin"). Unique on platform.
export const profiles = brandTracker.table(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull(),
    handle: text("handle"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("profiles_platform_idx").on(t.platform)],
);

// ── imports ─────────────────────────────────────────────────────────────────
// One row per file upload. Tracks aggregate-level summary fields from the
// LinkedIn Analytics export header rows.
export const imports = brandTracker.table("imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  source: text("source").notNull(), // "linkedin_analytics" | "linkedin_post" | "favikon" | "manual"
  fileName: text("file_name").notNull(),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  totalImpressions: integer("total_impressions"),
  totalMembersReached: integer("total_members_reached"),
  totalFollowersAtEnd: integer("total_followers_at_end"),
  rowCount: integer("row_count"),
  status: text("status").notNull(), // "pending" | "processing" | "completed" | "failed"
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── daily_metrics ───────────────────────────────────────────────────────────
// Merges engagement (Sheet 2) + follower (Sheet 4) data from the aggregate
// LinkedIn export. Unique on (platform, date) — upsert on re-import.
export const dailyMetrics = brandTracker.table(
  "daily_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull(),
    date: date("date").notNull(),
    impressions: integer("impressions"),
    interactions: integer("interactions"),
    newFollowers: integer("new_followers"),
    profileViews: integer("profile_views"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_metrics_platform_date_idx").on(t.platform, t.date),
  ],
);

// ── posts ───────────────────────────────────────────────────────────────────
// Merged from aggregate top-50 list + per-post exports. Matched via
// platform_id (numeric part of the activity URN in the post URL).
// Unique on (platform, platform_id) — upsert on re-import.
export const posts = brandTracker.table(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: text("platform").notNull(),
    platformId: text("platform_id").notNull(),
    url: text("url"),
    publishedAt: date("published_at").notNull(),
    publishedTime: text("published_time"), // "18:49" — per-post export only
    content: text("content"),
    contentType: text("content_type"), // "text" | "image" | "video" | "carousel"

    // From aggregate report (top-50 lists)
    impressions: integer("impressions"),
    interactions: integer("interactions"),

    // From per-post export
    membersReached: integer("members_reached"),
    reactions: integer("reactions"),
    comments: integer("comments"),
    shares: integer("shares"),
    saves: integer("saves"),
    linkClicks: integer("link_clicks"),
    profileViewsFromPost: integer("profile_views_from_post"),
    followersFromPost: integer("followers_from_post"),
    sends: integer("sends"),

    // Video metrics
    videoViews: integer("video_views"),
    videoWatchTimeSeconds: integer("video_watch_time_seconds"),
    videoAvgWatchSeconds: integer("video_avg_watch_seconds"),

    engagementRate: real("engagement_rate"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("posts_platform_platform_id_idx").on(
      t.platform,
      t.platformId,
    ),
  ],
);

// ── post_link_clicks ────────────────────────────────────────────────────────
// Per-URL click breakdown from per-post exports. Each post can reference 1-3
// external URLs, each with its own click count.
export const postLinkClicks = brandTracker.table(
  "post_link_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    url: text("url").notNull(),
    clicks: integer("clicks").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("post_link_clicks_post_url_idx").on(t.postId, t.url),
  ],
);

// ── post_engagement_highlights ──────────────────────────────────────────────
// Per-post audience highlights from per-post exports. LinkedIn provides the
// top job title, location, and industry for each engagement type (reactions,
// comments, shares) over a date range.
export const postEngagementHighlights = brandTracker.table(
  "post_engagement_highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    engagementType: text("engagement_type").notNull(), // "reaction" | "comment" | "share"
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    topJobTitle: text("top_job_title"),
    topLocation: text("top_location"),
    topIndustry: text("top_industry"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("post_engagement_highlights_unique_idx").on(
      t.postId,
      t.engagementType,
    ),
  ],
);

// ── demographics_snapshots ──────────────────────────────────────────────────
// Audience breakdown per aggregate import (Sheet 5) or per individual post
// (per-post export Sheet 2). Exactly one of import_id / post_id is set.
export const demographicsSnapshots = brandTracker.table(
  "demographics_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importId: uuid("import_id").references(() => imports.id),
    postId: uuid("post_id").references(() => posts.id),
    platform: text("platform").notNull(),
    category: text("category").notNull(), // "job_title" | "location" | "industry" | "seniority" | "company_size" | "company"
    value: text("value").notNull(),
    percentage: real("percentage").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("demographics_unique_idx").on(
      t.importId,
      t.postId,
      t.platform,
      t.category,
      t.value,
    ),
  ],
);
