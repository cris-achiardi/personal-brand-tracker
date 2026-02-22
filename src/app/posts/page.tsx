import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import PostsBrowser from "./posts-browser";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const allPosts = await db
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
    .orderBy(desc(posts.publishedAt));

  return <PostsBrowser posts={allPosts} />;
}
