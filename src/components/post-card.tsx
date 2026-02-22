import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TYPE_META, type Post, type PostType } from "@/lib/posts";

export function TypeBadge({ type }: { type: PostType }) {
  const tm = TYPE_META[type];
  return (
    <Badge
      variant="ghost"
      className={`text-[9px] font-mono rounded px-1.5 py-0 ${tm.tw} ${tm.bg}`}
    >
      {tm.label}
    </Badge>
  );
}

export function LangBadge({ lang }: { lang: string }) {
  return (
    <Badge
      variant="ghost"
      className={`text-[9px] font-mono rounded px-1.5 py-0 bg-white/5 ${
        lang === "ES" ? "text-neon" : "text-azure"
      }`}
    >
      {lang}
    </Badge>
  );
}

export function ContentTypeBadge({ type }: { type: string }) {
  const icons: Record<string, string> = {
    video: "\uD83C\uDFAC",
    image: "\uD83D\uDDBC\uFE0F",
    carousel: "\uD83D\uDCD1",
    text: "\uD83D\uDCDD",
  };
  return (
    <span className="text-[9px] font-mono text-muted-foreground/40">
      {icons[type] ?? icons.text}
    </span>
  );
}

export function PostCard({ post, maxEng }: { post: Post; maxEng: number }) {
  const dowColor =
    post.dow === "Fri"
      ? "text-coral"
      : ["Mon", "Wed"].includes(post.dow)
        ? "text-neon"
        : "text-muted-foreground/50";

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card className="py-0 gap-0 transition-all duration-150 group-hover:border-neon/15 group-hover:bg-neon/[0.03] group-hover:-translate-y-px">
        <CardContent className="px-3.5 py-3 flex gap-3 items-start">
          <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 text-base">
            <ContentTypeBadge type={post.contentType} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex gap-1 mb-1.5 flex-wrap items-center">
              <TypeBadge type={post.type} />
              <LangBadge lang={post.lang} />
              <span className={`text-[9px] font-mono ml-0.5 ${dowColor}`}>
                {post.dow}
              </span>
              {post.contentType === "video" && post.videoViews != null && (
                <span className="text-[9px] font-mono text-azure/60 ml-1">
                  {post.videoViews.toLocaleString()} views
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed mb-2 line-clamp-2">
              {post.name}
            </p>
            <div className="flex gap-2.5 items-center flex-wrap">
              <span className="text-[10px] text-muted-foreground/35 font-mono">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })}
              </span>
              {(
                [
                  ["\u2665", post.likes, "#ff6b6b"],
                  ["\uD83D\uDCAC", post.comments, "#74b9ff"],
                  ["\u2197", post.shares, "#a29bfe"],
                  ["\uD83D\uDD16", post.saves, "#fd79a8"],
                ] as const
              ).map(([icon, val, color]) =>
                val > 0 ? (
                  <span
                    key={icon}
                    className="flex items-center gap-1 text-[10px] text-foreground/40 font-mono"
                  >
                    <span style={{ color }} className="text-[9px]">
                      {icon}
                    </span>
                    {val}
                  </span>
                ) : null,
              )}
              {post.impressions > 0 && (
                <span className="text-[10px] text-muted-foreground/30 font-mono">
                  {post.impressions.toLocaleString()} imp
                </span>
              )}
              <span className="ml-auto text-[10px] text-neon/55 font-mono">
                {post.engagement} eng
              </span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-sm mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-neon to-neon/60"
                style={{
                  width: `${(post.engagement / maxEng) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
