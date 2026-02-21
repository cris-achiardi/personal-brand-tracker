import path from "path";
import fs from "fs";
import { sql } from "drizzle-orm";
import { db } from "../lib/db/client";
import {
  profiles,
  imports,
  dailyMetrics,
  posts,
  postLinkClicks,
  postEngagementHighlights,
  demographicsSnapshots,
} from "../lib/db/schema";
import { parseAggregateReport } from "../lib/parsers/linkedin/aggregate-parser";
import { parsePostReport } from "../lib/parsers/linkedin/post-parser";

const PLATFORM = "linkedin";
const REPORTS_DIR = path.resolve("docs/linkedin-reports");
const POSTS_DIR = path.join(REPORTS_DIR, "posts-analytics");

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== LinkedIn Data Import ===\n");

  // 1. Ensure "linkedin" profile exists
  const [profile] = await db
    .insert(profiles)
    .values({ platform: PLATFORM })
    .onConflictDoNothing()
    .returning();
  if (profile) {
    console.log(`Created profile: ${profile.id}`);
  } else {
    console.log("Profile already exists.");
  }

  // 2. Import aggregate report
  const aggregateFile = findAggregateFile();
  if (aggregateFile) {
    console.log(`\n--- Aggregate report: ${path.basename(aggregateFile)} ---`);
    await importAggregate(aggregateFile);
  } else {
    console.error("No aggregate report found!");
  }

  // 3. Import per-post reports
  const postFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".xlsx"))
    .map((f) => path.join(POSTS_DIR, f));

  console.log(`\n--- Importing ${postFiles.length} per-post reports ---`);
  let successCount = 0;
  let failCount = 0;

  for (const filePath of postFiles) {
    try {
      await importPostFile(filePath);
      successCount++;
    } catch (err) {
      failCount++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED ${path.basename(filePath)}: ${msg}`);

      // Record failed import
      await db.insert(imports).values({
        platform: PLATFORM,
        source: "linkedin_post",
        fileName: path.basename(filePath),
        status: "failed",
        errorMessage: msg,
      });
    }
  }

  // 4. Print summary
  console.log("\n=== Import Summary ===");
  const [dmCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyMetrics);
  const [postCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts);
  const [demoCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(demographicsSnapshots);
  const [linkCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postLinkClicks);
  const [highlightCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postEngagementHighlights);

  console.log(`  daily_metrics:            ${dmCount.count}`);
  console.log(`  posts:                    ${postCount.count}`);
  console.log(`  demographics_snapshots:   ${demoCount.count}`);
  console.log(`  post_link_clicks:         ${linkCount.count}`);
  console.log(`  post_engagement_highlights: ${highlightCount.count}`);
  console.log(`  per-post files: ${successCount} ok, ${failCount} failed`);

  process.exit(0);
}

// ── Aggregate import ────────────────────────────────────────────────────────

async function importAggregate(filePath: string) {
  const report = await parseAggregateReport(filePath);
  const { discovery, dailyEngagement, followers, demographics } = report;

  // Create import record
  const [importRow] = await db
    .insert(imports)
    .values({
      platform: PLATFORM,
      source: "linkedin_analytics",
      fileName: path.basename(filePath),
      periodStart: discovery.periodStart,
      periodEnd: discovery.periodEnd,
      totalImpressions: discovery.totalImpressions,
      totalMembersReached: discovery.totalMembersReached,
      totalFollowersAtEnd: followers.totalFollowers,
      rowCount: dailyEngagement.length,
      status: "completed",
    })
    .returning();

  console.log(`  Import record: ${importRow.id}`);

  // Build a date→newFollowers lookup from followers sheet
  const followersByDate = new Map(
    followers.daily.map((f) => [f.date, f.newFollowers]),
  );

  // Upsert daily metrics (merge engagement + followers by date)
  const dailyValues = dailyEngagement.map((d) => ({
    platform: PLATFORM,
    date: d.date,
    impressions: d.impressions,
    interactions: d.interactions,
    newFollowers: followersByDate.get(d.date) ?? 0,
  }));

  if (dailyValues.length > 0) {
    await db
      .insert(dailyMetrics)
      .values(dailyValues)
      .onConflictDoUpdate({
        target: [dailyMetrics.platform, dailyMetrics.date],
        set: {
          impressions: sql`excluded.impressions`,
          interactions: sql`excluded.interactions`,
          newFollowers: sql`excluded.new_followers`,
          updatedAt: sql`now()`,
        },
      });
    console.log(`  daily_metrics: ${dailyValues.length} rows upserted`);
  }

  // Insert aggregate demographics
  if (demographics.length > 0) {
    await db
      .insert(demographicsSnapshots)
      .values(
        demographics.map((d) => ({
          importId: importRow.id,
          platform: PLATFORM,
          category: d.category,
          value: d.value,
          percentage: d.percentage,
        })),
      )
      .onConflictDoNothing();
    console.log(`  demographics: ${demographics.length} rows inserted`);
  }
}

// ── Per-post import ─────────────────────────────────────────────────────────

async function importPostFile(filePath: string) {
  const fileName = path.basename(filePath);
  const report = await parsePostReport(filePath);
  const { performance: perf, demographics } = report;

  // Create import record
  const [importRow] = await db
    .insert(imports)
    .values({
      platform: PLATFORM,
      source: "linkedin_post",
      fileName,
      periodStart: perf.publishedAt,
      periodEnd: perf.publishedAt,
      status: "completed",
    })
    .returning();

  // Upsert post (preserving aggregate impressions/interactions via COALESCE)
  const totalLinkClicks = perf.linkClicks.reduce(
    (sum, lc) => sum + lc.clicks,
    0,
  );
  const [postRow] = await db
    .insert(posts)
    .values({
      platform: PLATFORM,
      platformId: perf.platformId,
      url: perf.url,
      publishedAt: perf.publishedAt,
      publishedTime: perf.publishedTime,
      impressions: perf.impressions,
      membersReached: perf.membersReached,
      reactions: perf.reactions,
      comments: perf.comments,
      shares: perf.shares,
      saves: perf.saves,
      linkClicks: totalLinkClicks || null,
      profileViewsFromPost: perf.profileViewsFromPost,
      followersFromPost: perf.followersFromPost,
      sends: perf.sends,
      videoViews: perf.videoViews,
      videoWatchTimeSeconds: perf.videoWatchTimeSeconds,
      videoAvgWatchSeconds: perf.videoAvgWatchSeconds,
    })
    .onConflictDoUpdate({
      target: [posts.platform, posts.platformId],
      set: {
        url: sql`COALESCE(excluded.url, ${posts.url})`,
        publishedTime: sql`COALESCE(excluded.published_time, ${posts.publishedTime})`,
        impressions: sql`excluded.impressions`,
        membersReached: sql`excluded.members_reached`,
        reactions: sql`excluded.reactions`,
        comments: sql`excluded.comments`,
        shares: sql`excluded.shares`,
        saves: sql`excluded.saves`,
        linkClicks: sql`excluded.link_clicks`,
        profileViewsFromPost: sql`excluded.profile_views_from_post`,
        followersFromPost: sql`excluded.followers_from_post`,
        sends: sql`excluded.sends`,
        videoViews: sql`excluded.video_views`,
        videoWatchTimeSeconds: sql`excluded.video_watch_time_seconds`,
        videoAvgWatchSeconds: sql`excluded.video_avg_watch_seconds`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  const postId = postRow.id;

  // Insert link clicks
  if (perf.linkClicks.length > 0) {
    await db
      .insert(postLinkClicks)
      .values(
        perf.linkClicks.map((lc) => ({
          postId,
          url: lc.url,
          clicks: lc.clicks,
        })),
      )
      .onConflictDoUpdate({
        target: [postLinkClicks.postId, postLinkClicks.url],
        set: {
          clicks: sql`excluded.clicks`,
        },
      });
  }

  // Insert engagement highlights
  if (perf.engagementHighlights.length > 0) {
    await db
      .insert(postEngagementHighlights)
      .values(
        perf.engagementHighlights.map((eh) => ({
          postId,
          engagementType: eh.engagementType,
          periodStart: eh.periodStart,
          periodEnd: eh.periodEnd,
          topJobTitle: eh.topJobTitle,
          topLocation: eh.topLocation,
          topIndustry: eh.topIndustry,
        })),
      )
      .onConflictDoUpdate({
        target: [
          postEngagementHighlights.postId,
          postEngagementHighlights.engagementType,
        ],
        set: {
          periodStart: sql`excluded.period_start`,
          periodEnd: sql`excluded.period_end`,
          topJobTitle: sql`excluded.top_job_title`,
          topLocation: sql`excluded.top_location`,
          topIndustry: sql`excluded.top_industry`,
        },
      });
  }

  // Insert per-post demographics
  if (demographics.length > 0) {
    await db
      .insert(demographicsSnapshots)
      .values(
        demographics.map((d) => ({
          postId,
          platform: PLATFORM,
          category: d.category,
          value: d.value,
          percentage: d.percentage,
        })),
      )
      .onConflictDoNothing();
  }

  process.stdout.write(".");
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findAggregateFile(): string | null {
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith("Contenido_") && f.endsWith(".xlsx"));
  if (files.length === 0) return null;
  return path.join(REPORTS_DIR, files[0]);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
