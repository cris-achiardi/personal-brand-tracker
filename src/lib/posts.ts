// Shared types, constants, and utilities for post data

// ── Types ───────────────────────────────────────────────────────────────────

export interface DbPost {
  id: string;
  platformId: string;
  publishedAt: string;
  content: string | null;
  postUrl: string | null;
  contentType: string | null;
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  impressions: number | null;
  membersReached: number | null;
  videoViews: number | null;
  videoAvgWatchSeconds: number | null;
  followersFromPost: number | null;
  engagementRate: number | null;
}

export interface Post {
  id: string;
  name: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  engagement: number;
  url: string;
  lang: "ES" | "EN";
  type: PostType;
  dow: string;
  month: string;
  monthLabel: string;
  contentType: string;
  videoViews: number | null;
  videoAvgWatchSeconds: number | null;
  followersFromPost: number;
  engagementRate: number | null;
}

export type PostType = "demo" | "framework" | "observation" | "announcement";

export type SortKey = (typeof SORT_OPTS)[number]["k"];

// ── Constants ───────────────────────────────────────────────────────────────

export const TYPE_META: Record<PostType, { label: string; tw: string; bg: string; hex: string }> = {
  demo:         { label: "Demo",     tw: "text-neon",     bg: "bg-neon/10",     hex: "#e8ff47" },
  framework:    { label: "How-to",   tw: "text-azure",    bg: "bg-azure/10",    hex: "#74b9ff" },
  observation:  { label: "Take",     tw: "text-blush",    bg: "bg-blush/10",    hex: "#fd79a8" },
  announcement: { label: "Announce", tw: "text-lavender", bg: "bg-lavender/10", hex: "#a29bfe" },
};

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const SORT_OPTS = [
  { k: "date" as const, l: "Date" },
  { k: "engagement" as const, l: "Eng" },
  { k: "likes" as const, l: "Likes" },
  { k: "comments" as const, l: "Cmts" },
  { k: "shares" as const, l: "Shares" },
];

// ── Tagging ─────────────────────────────────────────────────────────────────

export function detectLang(name: string): "ES" | "EN" {
  const en =
    /\b(the |a |an |of |is |are |was |for |that|this|with|have|has |what|how |about|just|ever|does|make|real|only|one |been|into|can |you |your|our |my |we |they|it )\b/i;
  return (name.match(en) || []).length >= 2 ? "EN" : "ES";
}

export function detectType(name: string): PostType {
  const n = name.toLowerCase();
  if (
    /creé|publiqué|acabo de|ya está|hice |made|built|created|just |launched|published|v2|primer plugin|segundo plugin|skill.*listas|lanzar un template/.test(
      n,
    )
  )
    return "demo";
  if (
    /qué hace|cómo |settings|usa |features|flujo|capas|desde un|rápida|rápido|import|export|usar!/.test(
      n,
    )
  )
    return "framework";
  if (
    /hackaton|techton|conference|cupos|evento|panita|se colo|nemo|diana/.test(n)
  )
    return "announcement";
  return "observation";
}

// ── Data transform ──────────────────────────────────────────────────────────

export function transformPosts(dbPosts: DbPost[]): Post[] {
  return dbPosts.map((p) => {
    const name = p.content ? p.content.slice(0, 120) : "Untitled post";
    const d = new Date(p.publishedAt + "T12:00:00");
    const likes = p.reactions ?? 0;
    const comments = p.comments ?? 0;
    const shares = p.shares ?? 0;
    const saves = p.saves ?? 0;
    return {
      id: p.id,
      name,
      date: p.publishedAt,
      likes,
      comments,
      shares,
      saves,
      impressions: p.impressions ?? 0,
      engagement: likes + comments + shares,
      url: p.postUrl ?? "#",
      lang: detectLang(name),
      type: detectType(name),
      dow: DAYS[d.getDay()],
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      monthLabel: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      contentType: p.contentType ?? "text",
      videoViews: p.videoViews,
      videoAvgWatchSeconds: p.videoAvgWatchSeconds,
      followersFromPost: p.followersFromPost ?? 0,
      engagementRate: p.engagementRate,
    };
  });
}
