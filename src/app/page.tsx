import { db } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Dashboard from "./dashboard";

export default async function Home() {
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
    })
    .from(posts)
    .orderBy(desc(posts.publishedAt));

  return <Dashboard posts={allPosts} />;
}
