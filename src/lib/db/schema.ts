import {
  pgSchema,
  uuid,
  text,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";

export const brandTracker = pgSchema("brand_tracker");

export const profiles = brandTracker.table("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = brandTracker.table("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id),
  platform: text("platform").notNull(),
  externalId: text("external_id"),
  content: text("content"),
  contentType: text("content_type").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postMetrics = brandTracker.table("post_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id),
  impressions: integer("impressions"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  clicks: integer("clicks"),
  engagementRate: real("engagement_rate"),
  snapshotDate: timestamp("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileMetrics = brandTracker.table("profile_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id),
  followers: integer("followers"),
  profileViews: integer("profile_views"),
  connections: integer("connections"),
  snapshotDate: timestamp("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const imports = brandTracker.table("imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
