"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/post-card";
import {
  TYPE_META,
  SORT_OPTS,
  transformPosts,
  type DbPost,
  type PostType,
  type SortKey,
} from "@/lib/posts";

const PAGE_SIZE = 20;

export default function PostsBrowser({ posts: dbPosts }: { posts: DbPost[] }) {
  const posts = useMemo(() => transformPosts(dbPosts), [dbPosts]);

  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState<"all" | PostType>("all");
  const [langF, setLangF] = useState<"all" | "ES" | "EN">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return posts
      .filter(
        (p) =>
          (typeF === "all" || p.type === typeF) &&
          (langF === "all" || p.lang === langF) &&
          (!search || p.name.toLowerCase().includes(search.toLowerCase())),
      )
      .sort((a, b) => {
        const va = sort === "date" ? new Date(a.date).getTime() : a[sort];
        const vb = sort === "date" ? new Date(b.date).getTime() : b[sort];
        return dir === "desc"
          ? (vb as number) - (va as number)
          : (va as number) - (vb as number);
      });
  }, [posts, sort, dir, search, typeF, langF]);

  // Reset visible count when filters change
  const filterKey = `${typeF}-${langF}-${search}-${sort}-${dir}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const maxEng = Math.max(...posts.map((p) => p.engagement), 1);
  const topPost = posts.length
    ? posts.reduce((a, b) => (a.engagement > b.engagement ? a : b))
    : null;

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSort(k);
      setDir("desc");
    }
  };

  return (
    <div className="h-screen flex flex-col max-w-[920px] mx-auto px-4">
      {/* ── Fixed header ── */}
      <div className="flex-shrink-0 pt-4 pb-3">
        {/* Top post */}
        {topPost && (
          <Card className="py-0 gap-0 mb-3 border-neon/15 bg-neon/[0.04]">
            <CardContent className="px-3.5 py-2.5 flex items-center gap-2.5">
              <span>&#127942;</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-neon/50 font-mono tracking-wider mb-0.5">
                  TOP POST &middot;{" "}
                  {TYPE_META[topPost.type].label.toUpperCase()} &middot;{" "}
                  {topPost.lang} &middot; {topPost.dow.toUpperCase()}
                </p>
                <p className="text-xs text-foreground truncate">
                  {topPost.name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold text-neon font-mono">
                  {topPost.engagement}
                </div>
                <div className="text-[9px] text-muted-foreground/30 font-mono">
                  ENG
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter controls */}
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[140px] h-8 text-xs"
          />
          <div className="flex gap-1 flex-wrap">
            {(
              ["all", "demo", "framework", "observation", "announcement"] as const
            ).map((f) => {
              const active = typeF === f;
              const tm = f !== "all" ? TYPE_META[f] : null;
              return (
                <Button
                  key={f}
                  variant={active ? "secondary" : "ghost"}
                  size="xs"
                  className={`font-mono text-[10px] ${active && tm ? tm.tw : ""}`}
                  onClick={() => setTypeF(f)}
                >
                  {f === "all" ? "All" : TYPE_META[f].label}
                </Button>
              );
            })}
          </div>
          <div className="flex gap-1">
            {(["all", "ES", "EN"] as const).map((f) => {
              const active = langF === f;
              return (
                <Button
                  key={f}
                  variant={active ? "secondary" : "ghost"}
                  size="xs"
                  className={`font-mono text-[10px] ${
                    active && f === "ES"
                      ? "text-neon"
                      : active && f === "EN"
                        ? "text-azure"
                        : ""
                  }`}
                  onClick={() => setLangF(f)}
                >
                  {f === "all" ? "ES+EN" : f}
                </Button>
              );
            })}
          </div>
          <div className="flex gap-1 flex-wrap">
            {SORT_OPTS.map(({ k, l }) => (
              <Button
                key={k}
                variant={sort === k ? "secondary" : "ghost"}
                size="xs"
                className="font-mono text-[10px]"
                onClick={() => toggleSort(k)}
              >
                {l}
                {sort === k && (
                  <span className="text-[8px] ml-0.5">
                    {dir === "desc" ? "\u2193" : "\u2191"}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/30 font-mono">
          {filtered.length} of {posts.length} posts
        </p>
      </div>

      {/* ── Scrollable post list ── */}
      <div className="flex-1 overflow-y-auto pb-6 pt-2">
        <div className="flex flex-col gap-1.5">
          {visible.map((post) => (
            <PostCard key={post.id} post={post} maxEng={maxEng} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground/20 font-mono text-[11px]">
              no posts match
            </div>
          )}
        </div>
        {remaining > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-[11px] text-muted-foreground/50 hover:text-neon"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Show {Math.min(remaining, PAGE_SIZE)} more ({remaining} remaining)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
