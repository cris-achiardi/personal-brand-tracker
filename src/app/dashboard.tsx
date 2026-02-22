"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/post-card";
import {
  TYPE_META,
  DAYS,
  transformPosts,
  type DbPost,
  type Post,
  type PostType,
} from "@/lib/posts";

// ── Dashboard-only types ────────────────────────────────────────────────────

export interface DailyMetric {
  date: string;
  impressions: number | null;
  interactions: number | null;
  newFollowers: number | null;
  profileViews: number | null;
}

export interface Demographic {
  category: string;
  value: string;
  percentage: number;
}

// ── Insights hook ───────────────────────────────────────────────────────────

function useInsights(posts: Post[]) {
  return useMemo(() => {
    const byType: Record<string, { count: number; eng: number; shares: number }> = {};
    posts.forEach((p) => {
      if (!byType[p.type]) byType[p.type] = { count: 0, eng: 0, shares: 0 };
      byType[p.type].count++;
      byType[p.type].eng += p.engagement;
      byType[p.type].shares += p.shares;
    });
    const typeAvgs = Object.entries(byType)
      .map(([t, v]) => ({
        type: t as PostType,
        avg: Math.round(v.eng / v.count),
        count: v.count,
        shares: v.shares,
      }))
      .sort((a, b) => b.avg - a.avg);

    const byLang: Record<string, { count: number; eng: number }> = {};
    posts.forEach((p) => {
      if (!byLang[p.lang]) byLang[p.lang] = { count: 0, eng: 0 };
      byLang[p.lang].count++;
      byLang[p.lang].eng += p.engagement;
    });
    const langAvgs = Object.entries(byLang).map(([l, v]) => ({
      lang: l,
      avg: Math.round(v.eng / v.count),
      count: v.count,
    }));

    const byDow: Record<string, { count: number; eng: number }> = {};
    DAYS.forEach((d) => (byDow[d] = { count: 0, eng: 0 }));
    posts.forEach((p) => {
      byDow[p.dow].count++;
      byDow[p.dow].eng += p.engagement;
    });
    const dowData = DAYS.map((d) => ({
      day: d,
      count: byDow[d].count,
      avg: byDow[d].count ? Math.round(byDow[d].eng / byDow[d].count) : 0,
    }));

    const typeDay: Record<string, { count: number; total: number }> = {};
    posts.forEach((p) => {
      const k = `${p.type}_${p.dow}`;
      if (!typeDay[k]) typeDay[k] = { count: 0, total: 0 };
      typeDay[k].count++;
      typeDay[k].total += p.engagement;
    });
    const typeDayMatrix = Object.entries(typeDay).map(([k, v]) => {
      const [type, day] = k.split("_");
      return { type, day, avg: Math.round(v.total / v.count), count: v.count };
    });

    const byMonth: Record<string, { count: number; eng: number; label: string }> = {};
    posts.forEach((p) => {
      if (!byMonth[p.month])
        byMonth[p.month] = { count: 0, eng: 0, label: p.monthLabel };
      byMonth[p.month].count++;
      byMonth[p.month].eng += p.engagement;
    });
    const monthData = Object.entries(byMonth)
      .sort()
      .map(([m, v]) => ({
        month: m,
        label: v.label,
        count: v.count,
        avg: Math.round(v.eng / v.count),
        total: v.eng,
      }));

    const sorted = [...posts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const mid = Math.floor(sorted.length / 2);
    const earlyAvg = mid
      ? Math.round(
          sorted.slice(0, mid).reduce((s, p) => s + p.engagement, 0) / mid,
        )
      : 0;
    const lateAvg =
      sorted.length - mid
        ? Math.round(
            sorted.slice(mid).reduce((s, p) => s + p.engagement, 0) /
              (sorted.length - mid),
          )
        : 0;

    const shareLeaders = [...posts]
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 3);

    const bestSlots = typeDayMatrix
      .filter(
        (t) =>
          ["demo", "framework"].includes(t.type) &&
          ["Mon", "Wed", "Thu"].includes(t.day) &&
          t.count >= 1,
      )
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);

    return {
      typeAvgs,
      langAvgs,
      dowData,
      typeDayMatrix,
      monthData,
      earlyAvg,
      lateAvg,
      shareLeaders,
      bestSlots,
    };
  }, [posts]);
}

// ── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#e8ff47" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 100;
  const H = 32;
  const pts = data
    .map(
      (v, i) =>
        `${(i / Math.max(data.length - 1, 1)) * W},${H - (v / max) * (H - 2)}`,
    )
    .join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full block"
      style={{ height: H }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── DowChart ────────────────────────────────────────────────────────────────

function DowChart({
  dowData,
  typeDayMatrix,
  activeType,
}: {
  dowData: { day: string; count: number; avg: number }[];
  typeDayMatrix: { type: string; day: string; avg: number; count: number }[];
  activeType: string;
}) {
  const maxAvg = Math.max(...dowData.map((d) => d.avg), 1);

  return (
    <div className="flex gap-1 items-end h-20">
      {dowData.map((d) => {
        const pct = d.avg / maxAvg;
        const isBad = d.day === "Fri";
        const isGood = ["Mon", "Wed"].includes(d.day);
        const barColor = isBad
          ? "#ff6b6b"
          : isGood
            ? "#e8ff47"
            : "rgba(255,255,255,0.25)";
        const typeStat =
          activeType !== "all"
            ? typeDayMatrix.find(
                (t) => t.type === activeType && t.day === d.day,
              )
            : null;
        const typeH = typeStat
          ? Math.round((typeStat.avg / maxAvg) * 68)
          : 0;

        return (
          <div
            key={d.day}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            {typeStat && (
              <div
                className="w-full rounded-t-sm opacity-60"
                style={{
                  height: typeH,
                  background:
                    TYPE_META[activeType as PostType]?.hex,
                  minHeight: 2,
                }}
              />
            )}
            <div
              className="w-full"
              style={{
                height: Math.max(Math.round(pct * 68), 2),
                background: barColor,
                borderRadius: typeStat ? "0" : "3px 3px 0 0",
                opacity: d.count === 0 ? 0.15 : 1,
              }}
            />
            <span
              className={`text-[9px] font-mono tracking-wide ${
                isGood
                  ? "text-neon"
                  : isBad
                    ? "text-coral"
                    : "text-muted-foreground/50"
              }`}
            >
              {d.day}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/40">
              {d.avg}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── MonthlyChart ────────────────────────────────────────────────────────────

function MonthlyChart({
  monthData,
}: {
  monthData: {
    month: string;
    label: string;
    count: number;
    avg: number;
    total: number;
  }[];
}) {
  const maxAvg = Math.max(...monthData.map((m) => m.avg), 1);
  const peakMonth = monthData.reduce((a, b) => (a.avg > b.avg ? a : b)).month;

  return (
    <div>
      <div className="flex gap-1 items-end h-16">
        {monthData.map((m) => {
          const pct = m.avg / maxAvg;
          const isPeak = m.month === peakMonth;
          return (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              <div
                className="w-full rounded-t-sm relative"
                style={{
                  height: Math.max(Math.round(pct * 52), 2),
                  background: isPeak ? "#e8ff47" : "rgba(255,255,255,0.18)",
                }}
              >
                {isPeak && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-neon font-mono whitespace-nowrap">
                    peak
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] font-mono tracking-tight ${
                  isPeak ? "text-neon" : "text-muted-foreground/40"
                }`}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/40 italic mt-1.5">
        avg engagement per month
      </p>
    </div>
  );
}

// ── Small UI pieces ─────────────────────────────────────────────────────────

function ProgressBar({
  pct,
  color,
  h = 4,
}: {
  pct: number;
  color: string;
  h?: number;
}) {
  return (
    <div
      className="rounded-sm overflow-hidden bg-white/[0.06]"
      style={{ height: h }}
    >
      <div
        className="h-full rounded-sm transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Date range helpers ───────────────────────────────────────────────────────

type DateRangePreset = "30d" | "90d" | "3m" | "6m" | "all";

const DATE_RANGE_PRESETS: { k: DateRangePreset; l: string }[] = [
  { k: "30d", l: "30d" },
  { k: "90d", l: "90d" },
  { k: "3m", l: "3m" },
  { k: "6m", l: "6m" },
  { k: "all", l: "All" },
];

function getDateBounds(range: DateRangePreset) {
  if (range === "all") return null;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (range === "30d") start.setDate(start.getDate() - 30);
  else if (range === "90d") start.setDate(start.getDate() - 90);
  else if (range === "3m") start.setMonth(start.getMonth() - 3);
  else start.setMonth(start.getMonth() - 6);
  start.setHours(0, 0, 0, 0);
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd.getTime() - duration);
  prevStart.setHours(0, 0, 0, 0);
  return { start, end, prevStart, prevEnd };
}

function computeDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: "+\u221E", positive: true } : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return { value: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct > 0 };
}

function DeltaBadge({ delta }: { delta: { value: string; positive: boolean } | null }) {
  if (!delta) return null;
  return (
    <span
      className={`text-[10px] font-mono ml-1.5 ${delta.positive ? "text-neon" : "text-coral"}`}
    >
      {delta.value}
    </span>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard({
  posts: dbPosts,
  dailyMetrics: metrics = [],
  demographics = [],
  followerCount,
}: {
  posts: DbPost[];
  dailyMetrics?: DailyMetric[];
  demographics?: Demographic[];
  followerCount?: number | null;
}) {
  const posts = useMemo(() => transformPosts(dbPosts), [dbPosts]);

  const [chart, setChart] = useState<"engagement" | "shares">("engagement");
  const [dowType, setDowType] = useState<"all" | "demo" | "framework">("all");
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");

  const { periodPosts, prevPosts, periodMetrics, prevMetrics } = useMemo(() => {
    const bounds = getDateBounds(dateRange);
    if (!bounds) {
      return {
        periodPosts: posts,
        prevPosts: [] as Post[],
        periodMetrics: metrics,
        prevMetrics: [] as DailyMetric[],
      };
    }
    const { start, end, prevStart, prevEnd } = bounds;
    const inRange = (dateStr: string, s: Date, e: Date) => {
      const d = new Date(dateStr + "T12:00:00");
      return d >= s && d <= e;
    };
    return {
      periodPosts: posts.filter((p) => inRange(p.date, start, end)),
      prevPosts: posts.filter((p) => inRange(p.date, prevStart, prevEnd)),
      periodMetrics: metrics.filter((m) => inRange(m.date, start, end)),
      prevMetrics: metrics.filter((m) => inRange(m.date, prevStart, prevEnd)),
    };
  }, [dateRange, posts, metrics]);

  const ins = useInsights(periodPosts);

  const totalEng = periodPosts.reduce((s, p) => s + p.engagement, 0);
  const totalLikes = periodPosts.reduce((s, p) => s + p.likes, 0);
  const totalShares = periodPosts.reduce((s, p) => s + p.shares, 0);
  const avgEng = periodPosts.length ? Math.round(totalEng / periodPosts.length) : 0;
  const maxTypeAvg = Math.max(...ins.typeAvgs.map((t) => t.avg), 1);
  const growth = (ins.lateAvg / Math.max(ins.earlyAvg, 1)).toFixed(1);
  const esL = ins.langAvgs.find((l) => l.lang === "ES");
  const enL = ins.langAvgs.find((l) => l.lang === "EN");

  // ── Daily metrics computed ──
  const totalNewFollowers = periodMetrics.reduce((s, m) => s + (m.newFollowers ?? 0), 0);
  const totalProfileViews = periodMetrics.reduce((s, m) => s + (m.profileViews ?? 0), 0);
  const followerSpark = periodMetrics.map((m) => m.newFollowers ?? 0);
  const impressionSpark = periodMetrics.map((m) => m.impressions ?? 0);

  // ── Video stats ──
  const videoPosts = periodPosts.filter((p) => p.contentType === "video" && p.videoViews != null);
  const totalVideoViews = videoPosts.reduce((s, p) => s + (p.videoViews ?? 0), 0);
  const avgWatchSec = videoPosts.length
    ? Math.round(videoPosts.reduce((s, p) => s + (p.videoAvgWatchSeconds ?? 0), 0) / videoPosts.length)
    : 0;

  // ── Previous period (for deltas) ──
  const prevTotalEng = prevPosts.reduce((s, p) => s + p.engagement, 0);
  const prevAvgEng = prevPosts.length ? Math.round(prevTotalEng / prevPosts.length) : 0;
  const prevTotalLikes = prevPosts.reduce((s, p) => s + p.likes, 0);
  const prevTotalShares = prevPosts.reduce((s, p) => s + p.shares, 0);
  const prevNewFollowers = prevMetrics.reduce((s, m) => s + (m.newFollowers ?? 0), 0);
  const prevProfileViews = prevMetrics.reduce((s, m) => s + (m.profileViews ?? 0), 0);

  const showDeltas = dateRange !== "all";
  const engDelta = showDeltas ? computeDelta(totalEng, prevTotalEng) : null;
  const avgDelta = showDeltas ? computeDelta(avgEng, prevAvgEng) : null;
  const likesDelta = showDeltas ? computeDelta(totalLikes, prevTotalLikes) : null;
  const sharesDelta = showDeltas ? computeDelta(totalShares, prevTotalShares) : null;
  const newFollowersDelta = showDeltas ? computeDelta(totalNewFollowers, prevNewFollowers) : null;
  const profileViewsDelta = showDeltas ? computeDelta(totalProfileViews, prevProfileViews) : null;

  // ── Demographics grouped ──
  const demoGrouped = useMemo(() => {
    const groups: Record<string, { value: string; percentage: number }[]> = {};
    demographics.forEach((d) => {
      if (!groups[d.category]) groups[d.category] = [];
      groups[d.category].push({ value: d.value, percentage: d.percentage });
    });
    Object.values(groups).forEach((arr) => arr.sort((a, b) => b.percentage - a.percentage));
    return groups;
  }, [demographics]);

  // ── Followers from posts ──
  const totalFollowersFromPosts = periodPosts.reduce((s, p) => s + p.followersFromPost, 0);

  const sortedByDate = [...periodPosts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const chartData = sortedByDate.map((p) => p[chart]);

  const dateRangeLabel = periodPosts.length
    ? (() => {
        const dates = periodPosts.map((p) => new Date(p.date));
        const min = new Date(Math.min(...dates.map((d) => d.getTime())));
        const max = new Date(Math.max(...dates.map((d) => d.getTime())));
        const fmt = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return `${fmt(min)} \u2014 ${fmt(max)}`;
      })()
    : "";

  return (
    <div className="min-h-screen max-w-[920px] mx-auto px-4 py-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex justify-between items-end flex-wrap gap-2.5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              @cristian-morales-achiardi
            </h1>
            <p className="text-[11px] text-muted-foreground/45 mt-0.5">
              {periodPosts.length} posts &middot; {dateRangeLabel}
            </p>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <div className="flex gap-1">
              {DATE_RANGE_PRESETS.map(({ k, l }) => (
                <Button
                  key={k}
                  variant={dateRange === k ? "secondary" : "ghost"}
                  size="xs"
                  className={`font-mono text-[10px] ${dateRange === k ? "text-neon" : ""}`}
                  onClick={() => setDateRange(k)}
                >
                  {l}
                </Button>
              ))}
            </div>
            <div className="h-3.5 w-px bg-white/10" />
            <div className="flex gap-1">
              <Button
                variant={chart === "engagement" ? "secondary" : "ghost"}
                size="xs"
                className={`font-mono text-[10px] ${chart === "engagement" ? "text-neon" : ""}`}
                onClick={() => setChart("engagement")}
              >
                engagement
              </Button>
              <Button
                variant={chart === "shares" ? "secondary" : "ghost"}
                size="xs"
                className={`font-mono text-[10px] ${chart === "shares" ? "text-lavender" : ""}`}
                onClick={() => setChart("shares")}
              >
                shares
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-2.5">
          <Sparkline
            data={chartData}
            color={chart === "shares" ? "#a29bfe" : "#e8ff47"}
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(
          [
            ["Total eng", totalEng.toLocaleString(), "text-neon", engDelta],
            ["Avg / post", String(avgEng), "text-neon", avgDelta],
            ["Likes", totalLikes.toLocaleString(), "text-coral", likesDelta],
            ["Shares", String(totalShares), "text-lavender", sharesDelta],
            ["Growth", `${growth}\u00D7`, "text-blush", null],
          ] as [string, string, string, ReturnType<typeof computeDelta>][]
        ).map(([label, value, accent, delta]) => (
          <Card key={label} className="flex-1 min-w-[100px] py-0 gap-0">
            <CardContent className="px-4 py-3.5">
              <div
                className={`text-xl font-bold font-mono tracking-tight ${accent}`}
              >
                {value}
                <DeltaBadge delta={delta} />
              </div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                {label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Reach & Followers row ── */}
      {(periodMetrics.length > 0 || followerCount || videoPosts.length > 0) && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {followerCount != null && (
            <Card className="flex-1 min-w-[120px] py-0 gap-0">
              <CardContent className="px-4 py-3.5">
                <div className="text-xl font-bold font-mono tracking-tight text-azure">
                  {followerCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                  Followers
                </div>
              </CardContent>
            </Card>
          )}
          {periodMetrics.length > 0 && (
            <>
              <Card className="flex-1 min-w-[120px] py-0 gap-0">
                <CardContent className="px-4 py-3.5">
                  <div className="text-xl font-bold font-mono tracking-tight text-azure">
                    +{totalNewFollowers.toLocaleString()}
                    <DeltaBadge delta={newFollowersDelta} />
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                    New followers
                  </div>
                  {followerSpark.length > 3 && (
                    <div className="mt-1.5">
                      <Sparkline data={followerSpark} color="#74b9ff" />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="flex-1 min-w-[120px] py-0 gap-0">
                <CardContent className="px-4 py-3.5">
                  <div className="text-xl font-bold font-mono tracking-tight text-foreground/70">
                    {totalProfileViews.toLocaleString()}
                    <DeltaBadge delta={profileViewsDelta} />
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                    Profile views
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {videoPosts.length > 0 && (
            <Card className="flex-1 min-w-[120px] py-0 gap-0">
              <CardContent className="px-4 py-3.5">
                <div className="text-xl font-bold font-mono tracking-tight text-azure">
                  {totalVideoViews.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                  Video views
                </div>
                <div className="text-[9px] text-muted-foreground/35 font-mono mt-0.5">
                  {videoPosts.length} videos &middot; avg {avgWatchSec}s watch
                </div>
              </CardContent>
            </Card>
          )}
          {totalFollowersFromPosts > 0 && (
            <Card className="flex-1 min-w-[120px] py-0 gap-0">
              <CardContent className="px-4 py-3.5">
                <div className="text-xl font-bold font-mono tracking-tight text-neon">
                  +{totalFollowersFromPosts}
                </div>
                <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                  Follows from posts
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Patterns ── */}
      <div className="mb-4">
        <p className="text-[10px] text-muted-foreground/40 font-mono tracking-[2px] uppercase mb-2.5">
          Patterns
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Type vs engagement */}
          <Card className="py-0 gap-0 border-t-2 border-t-neon">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#128202;</span> Type vs engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              {ins.typeAvgs.map((t) => {
                const tm = TYPE_META[t.type];
                return (
                  <div key={t.type} className="mb-2.5 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <TypeBadge type={t.type} />
                      <span className="text-[10px] text-muted-foreground/55 font-mono">
                        {t.avg} avg &middot; {t.count}p
                      </span>
                    </div>
                    <ProgressBar
                      pct={(t.avg / maxTypeAvg) * 100}
                      color={tm.hex}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Day of week */}
          <Card className="py-0 gap-0 border-t-2 border-t-neon">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#128197;</span> Day of week
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              <div className="flex gap-1 mb-2.5">
                {(["all", "demo", "framework"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={dowType === t ? "secondary" : "ghost"}
                    size="xs"
                    className="font-mono text-[9px] h-5 px-1.5"
                    onClick={() => setDowType(t)}
                  >
                    {t === "all" ? "All" : TYPE_META[t].label}
                  </Button>
                ))}
              </div>
              <DowChart
                dowData={ins.dowData}
                typeDayMatrix={ins.typeDayMatrix}
                activeType={dowType}
              />
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="py-0 gap-0 border-t-2 border-t-azure">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#128198;</span> Monthly avg eng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              <MonthlyChart monthData={ins.monthData} />
            </CardContent>
          </Card>

          {/* Best slots */}
          <Card className="py-0 gap-0 border-t-2 border-t-lavender">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#127919;</span> Best posting slots
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              <p className="text-[11px] text-muted-foreground/50 mb-2.5 leading-relaxed">
                Type &times; day combos with highest avg engagement
              </p>
              {ins.bestSlots.map((s, i) => {
                const dowColor =
                  s.day === "Mon"
                    ? "text-neon"
                    : s.day === "Wed"
                      ? "text-azure"
                      : "text-foreground/50";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 mb-2 last:mb-0"
                  >
                    <span className="text-[9px] text-muted-foreground/30 font-mono min-w-3">
                      {i + 1}
                    </span>
                    <TypeBadge type={s.type as PostType} />
                    <span
                      className={`text-[11px] font-semibold font-mono ${dowColor}`}
                    >
                      {s.day}
                    </span>
                    <span className="ml-auto text-xs font-bold text-neon font-mono">
                      {s.avg}
                    </span>
                    <span className="text-[10px] text-muted-foreground/30 font-mono">
                      avg
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Language split */}
          <Card className="py-0 gap-0 border-t-2 border-t-azure">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#127760;</span> Language split
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              {[esL, enL].filter(Boolean).map((l) => {
                const color = l!.lang === "ES" ? "#e8ff47" : "#74b9ff";
                const pct = Math.round((l!.count / periodPosts.length) * 100);
                return (
                  <div key={l!.lang} className="mb-2.5 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <span
                        className="text-sm font-semibold font-mono"
                        style={{ color }}
                      >
                        {l!.lang}
                      </span>
                      <span className="text-[10px] text-muted-foreground/55 font-mono">
                        {l!.avg} avg &middot; {l!.count}p ({pct}%)
                      </span>
                    </div>
                    <ProgressBar pct={pct} color={color} />
                  </div>
                );
              })}
              {esL && enL && (
                <p className="mt-2 text-[11px] text-muted-foreground/45 italic leading-relaxed">
                  ES gets{" "}
                  <span className="text-neon">
                    {Math.round(esL.avg / Math.max(enL.avg, 1))}&times;
                  </span>{" "}
                  more engagement than EN.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Spread leaders */}
          <Card className="py-0 gap-0 border-t-2 border-t-lavender">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&nearr;</span> Spread leaders
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              {ins.shareLeaders.map((p, i) => (
                <div
                  key={p.id}
                  className="flex gap-2 mb-2.5 last:mb-0 items-start"
                >
                  <span className="text-[10px] text-muted-foreground/25 font-mono min-w-3 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground/70 leading-snug mb-0.5 line-clamp-2">
                      {p.name}
                    </p>
                    <span className="text-[10px] text-lavender font-mono">
                      {p.shares} shares &middot; {p.engagement} eng
                    </span>
                  </div>
                </div>
              ))}
              <p className="mt-1 text-[10px] text-muted-foreground/35 italic">
                Shares = your audience thinks their network needs this.
              </p>
            </CardContent>
          </Card>

          {/* Growth */}
          <Card className="py-0 gap-0 border-t-2 border-t-blush md:col-span-2">
            <CardHeader className="px-4 pt-3.5 pb-0">
              <CardTitle className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                <span>&#128200;</span> Growth inflection
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3.5 pt-3">
              <div className="flex gap-5 mb-3 items-end">
                <div>
                  <div className="text-xl font-bold text-muted-foreground/30 font-mono">
                    {ins.earlyAvg}
                  </div>
                  <div className="text-[9px] text-muted-foreground/30 font-mono mt-0.5">
                    EARLY AVG
                  </div>
                </div>
                <div className="text-blush text-sm mb-1">&rarr;</div>
                <div>
                  <div className="text-xl font-bold text-blush font-mono">
                    {ins.lateAvg}
                  </div>
                  <div className="text-[9px] text-blush/45 font-mono mt-0.5">
                    RECENT AVG
                  </div>
                </div>
                <div className="ml-auto">
                  <div className="text-3xl font-bold text-neon font-mono leading-none">
                    {growth}&times;
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Audience ── */}
      {Object.keys(demoGrouped).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground/40 font-mono tracking-[2px] uppercase mb-2.5">
            Audience
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(["job_title", "industry", "location"] as const)
              .filter((cat) => demoGrouped[cat])
              .map((cat) => {
                const label =
                  cat === "job_title"
                    ? "Top Job Titles"
                    : cat === "industry"
                      ? "Top Industries"
                      : "Top Locations";
                const accent =
                  cat === "job_title"
                    ? "#e8ff47"
                    : cat === "industry"
                      ? "#74b9ff"
                      : "#a29bfe";
                return (
                  <Card
                    key={cat}
                    className="py-0 gap-0 border-t-2"
                    style={{ borderTopColor: accent }}
                  >
                    <CardHeader className="px-4 pt-3.5 pb-0">
                      <CardTitle className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[1.5px] font-normal">
                        {label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3.5 pt-3">
                      {demoGrouped[cat].slice(0, 5).map((d, i) => (
                        <div key={d.value} className="mb-2 last:mb-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] text-foreground/70 truncate mr-2">
                              {d.value}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                              {d.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <ProgressBar
                            pct={d.percentage}
                            color={
                              i === 0 ? accent : `${accent}80`
                            }
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Impressions trend ── */}
      {periodMetrics.length > 3 && (
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground/40 font-mono tracking-[2px] uppercase mb-2.5">
            Daily impressions
          </p>
          <Card className="py-0 gap-0">
            <CardContent className="px-4 py-3.5">
              <Sparkline data={impressionSpark} color="#74b9ff" />
              <p className="text-[10px] text-muted-foreground/35 font-mono mt-1.5">
                {periodMetrics.length} days tracked &middot; avg{" "}
                {Math.round(
                  impressionSpark.reduce((a, b) => a + b, 0) /
                    impressionSpark.length,
                ).toLocaleString()}{" "}
                impressions/day
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── View all posts link ── */}
      <Link href="/posts" className="block group">
        <Card className="py-0 gap-0 transition-all duration-150 group-hover:border-neon/15 group-hover:bg-neon/[0.03]">
          <CardContent className="px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/80">
                View all {periodPosts.length} posts
              </p>
              <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">
                Search, filter, and browse your full post history
              </p>
            </div>
            <span className="text-neon font-mono text-sm">&rarr;</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
