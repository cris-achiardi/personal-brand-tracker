import { eq, isNull, and } from "drizzle-orm";
import { db } from "../lib/db/client";
import { posts } from "../lib/db/schema";

const DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPostText(html: string): string | null {
  // Try og:description meta tag first (most reliable for post text)
  const ogMatch = html.match(
    /<meta\s+property="og:description"\s+content="([^"]*?)"/,
  );
  if (ogMatch?.[1]) {
    return decodeHtmlEntities(ogMatch[1]);
  }

  // Fallback: twitter:description
  const twMatch = html.match(
    /<meta\s+(?:name|property)="twitter:description"\s+content="([^"]*?)"/,
  );
  if (twMatch?.[1]) {
    return decodeHtmlEntities(twMatch[1]);
  }

  return null;
}

function extractActivityUrl(html: string): string | null {
  // Look for the canonical activity URL in meta tags or links
  // Pattern: https://www.linkedin.com/feed/update/urn:li:activity:XXXX
  const activityMatch = html.match(
    /(https:\/\/www\.linkedin\.com\/feed\/update\/urn:li:activity:\d+)/,
  );
  if (activityMatch?.[1]) {
    return activityMatch[1];
  }

  // Try og:url meta tag
  const ogUrlMatch = html.match(
    /<meta\s+property="og:url"\s+content="([^"]*?)"/,
  );
  if (ogUrlMatch?.[1] && ogUrlMatch[1].includes("linkedin.com")) {
    return ogUrlMatch[1];
  }

  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

async function main() {
  console.log("=== Fetch LinkedIn Post Content ===\n");

  // Get posts that still need content fetched
  const pendingPosts = await db
    .select({ id: posts.id, url: posts.url, platformId: posts.platformId })
    .from(posts)
    .where(and(isNull(posts.content), eq(posts.platform, "linkedin")));

  console.log(`Found ${pendingPosts.length} posts without content.\n`);

  if (pendingPosts.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < pendingPosts.length; i++) {
    const post = pendingPosts[i];
    const label = `[${i + 1}/${pendingPosts.length}] ${post.platformId}`;

    if (!post.url) {
      console.log(`${label} — no URL, skipping`);
      failCount++;
      continue;
    }

    try {
      // LinkedIn URN URLs resolve when fetched directly
      const fetchUrl = post.url.startsWith("http")
        ? post.url
        : `https://www.linkedin.com/feed/update/${post.url}`;

      const res = await fetch(fetchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        console.log(`${label} — HTTP ${res.status}`);
        failCount++;
        await sleep(DELAY_MS);
        continue;
      }

      const html = await res.text();
      const content = extractPostText(html);
      const postUrl = extractActivityUrl(html);

      if (!content && !postUrl) {
        console.log(`${label} — could not extract content or URL`);
        failCount++;
        await sleep(DELAY_MS);
        continue;
      }

      // Update the post row
      await db
        .update(posts)
        .set({
          ...(content ? { content } : {}),
          ...(postUrl ? { postUrl } : {}),
        })
        .where(eq(posts.id, post.id));

      const contentPreview = content
        ? content.slice(0, 60).replace(/\n/g, " ") + "…"
        : "(no text)";
      console.log(`${label} — OK: ${contentPreview}`);
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`${label} — ERROR: ${msg}`);
      failCount++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Done: ${successCount} updated, ${failCount} failed ===`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
