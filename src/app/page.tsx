import { db } from "@/lib/db/client";
import {
  posts,
  dailyMetrics,
  demographicsSnapshots,
  imports,
} from "@/lib/db/schema";
import { desc, asc, isNotNull } from "drizzle-orm";
import Dashboard from "./dashboard";

export default async function Home() {
  const [allPosts, metrics, demographics, latestImport] = await Promise.all([
    db
      .select({
        id: posts.id,
        platformId: posts.platformId,
        publishedAt: posts.publishedAt,
        content: posts.content,
        postUrl: posts.postUrl,
        contentType: posts.contentType,
        reactions: posts.reactions,
        comments: posts.comments,
        shares: posts.shares,
        saves: posts.saves,
        impressions: posts.impressions,
        membersReached: posts.membersReached,
        videoViews: posts.videoViews,
        videoAvgWatchSeconds: posts.videoAvgWatchSeconds,
        followersFromPost: posts.followersFromPost,
        engagementRate: posts.engagementRate,
      })
      .from(posts)
      .orderBy(desc(posts.publishedAt)),

    db
      .select({
        date: dailyMetrics.date,
        impressions: dailyMetrics.impressions,
        interactions: dailyMetrics.interactions,
        newFollowers: dailyMetrics.newFollowers,
        profileViews: dailyMetrics.profileViews,
      })
      .from(dailyMetrics)
      .orderBy(asc(dailyMetrics.date)),

    db
      .select({
        category: demographicsSnapshots.category,
        value: demographicsSnapshots.value,
        percentage: demographicsSnapshots.percentage,
      })
      .from(demographicsSnapshots)
      .where(isNotNull(demographicsSnapshots.importId)),

    db
      .select({
        totalFollowersAtEnd: imports.totalFollowersAtEnd,
        periodEnd: imports.periodEnd,
      })
      .from(imports)
      .orderBy(desc(imports.createdAt))
      .limit(1),
  ]);

  return (
    <Dashboard
      posts={allPosts}
      dailyMetrics={metrics}
      demographics={demographics}
      followerCount={latestImport[0]?.totalFollowersAtEnd ?? null}
    />
  );
}
