# Personal Brand Tracker - Implementation Plan

## Context

Build a personal brand tracker as a **cloneable template** that anyone can fork, deploy, and use to track their social media brand growth. Starting with LinkedIn data (via CSV imports from LinkedIn Analytics exports and Favikon). LinkedIn's API is locked down for individual developers (no access to post metrics/engagement), so CSV import is the primary and safest data ingestion method.

Deployed on Vercel with Supabase PostgreSQL as the database (free tier, 500MB). Uses a dedicated `brand_tracker` PostgreSQL schema so one Supabase project can host multiple small apps. Non-technical users should be able to fork, deploy, and import CSVs from any device.

---

## Current Status

**MVP deployed and functional.** The core data pipeline and dashboard are live on Vercel. Data is imported via CLI scripts that parse LinkedIn Analytics `.xlsx` exports and per-post `.xlsx` exports, then upsert into Supabase.

### What's built
- Full 7-table database schema under `brand_tracker` PostgreSQL schema
- LinkedIn Analytics `.xlsx` parser (aggregate report: engagement, followers, demographics, top posts)
- LinkedIn per-post `.xlsx` parser (detailed metrics per post)
- CLI import script (`pnpm import:linkedin`) that processes both export types
- Post content fetcher script (`pnpm fetch:content`) to enrich posts with readable URLs
- Single-page dashboard with shadcn/ui showing:
  - KPI cards (followers, impressions, engagement rate, post count)
  - Engagement trend chart (impressions + interactions over time)
  - Top posts table (sortable by impressions, with content preview)
  - Daily metrics chart (impressions + interactions)
  - Audience demographics breakdown (job title, location, industry)
  - Video performance stats
- Dark theme, responsive layout
- Deployed to Vercel with dynamic rendering

### What's pending
- **Auth**: NextAuth is configured but not wired to protect routes
- **CSV upload UI**: No browser-based import yet (CLI only)
- **Date range filter**: Dashboard shows all-time data, no date picker
- **Favikon parser**: Planned but not implemented
- **Generic CSV mapper**: Planned but not implemented
- **Multi-page dashboard**: Currently single-page; no separate posts/growth/import pages
- **Seed script / demo data**: Not yet created
- **One-click deploy button**: Not yet added

---

## Decisions Made

- **Stack**: Next.js (App Router) + Drizzle ORM + Supabase (PostgreSQL) + NextAuth + Recharts
- **Database**: Supabase PostgreSQL (free tier, 500MB) — shared project via `brand_tracker` schema, reuse for other projects
- **Auth**: NextAuth with credentials provider (hardcoded from env vars, optionally swap to OAuth)
- **Data ingestion**: CSV/XLSX import (LinkedIn Analytics exports, per-post exports); CLI-first, browser UI later
- **Schema**: Multi-platform from day 1 (platform field on all tables), LinkedIn UI only for PoC
- **Deployment**: Vercel (free hobby tier)
- **Dashboard UI**: shadcn/ui + Tailwind 4 (not inline styles), dark theme
- **Excel parsing**: ExcelJS for `.xlsx` files (LinkedIn exports are Excel, not CSV)

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 16 (App Router) | Full-stack, server components for DB queries |
| ORM | Drizzle | First-class PostgreSQL support, lightweight, type-safe, `pgSchema` for namespacing |
| Database | Supabase (PostgreSQL) | Free tier 500MB, shared across projects via schemas, managed, works with Vercel |
| Auth | NextAuth v5 (Auth.js) | Simple credentials provider, optionally OAuth |
| Charts | Recharts | React-native, composable, good for dashboards |
| UI | shadcn/ui + Tailwind 4 | Cloneable components, easy to customize |
| Excel parsing | ExcelJS | Handles LinkedIn `.xlsx` exports with multiple sheets |
| CSV parsing | Papa Parse | Backup for plain CSV files |
| Deployment | Vercel | Free tier, seamless Next.js integration |

---

## Project Structure

```
personal-brand-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (dark theme, fonts)
│   │   ├── page.tsx                  # Server component — queries DB, renders dashboard
│   │   ├── dashboard.tsx             # Client component — interactive charts & tables
│   │   ├── globals.css               # Tailwind 4 + shadcn/ui theme variables
│   │   └── api/                      # (future: CSV upload endpoint)
│   ├── components/
│   │   └── ui/                       # shadcn/ui components (card, badge, button, etc.)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema (7 tables, brand_tracker schema)
│   │   │   └── client.ts            # Drizzle + postgres.js client
│   │   ├── parsers/
│   │   │   ├── linkedin-analytics.ts # Aggregate report parser (5 sheets)
│   │   │   └── linkedin-post.ts      # Per-post export parser
│   │   ├── auth.ts                   # NextAuth config
│   │   └── utils.ts                  # cn() utility
│   └── scripts/
│       ├── import-linkedin.ts        # CLI: import LinkedIn exports from data/ folder
│       ├── fetch-post-content.ts     # CLI: fetch post content & readable URLs
│       └── check-followers.ts        # CLI: quick follower count check
├── data/                             # Local LinkedIn export files (gitignored)
├── docs/
│   └── brand-tracker-plan.md         # This file
├── drizzle/
│   └── migrations/                   # Drizzle migration files
├── drizzle.config.ts
├── .env.local                        # Environment variables (gitignored)
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## Database Schema (Drizzle + Supabase PostgreSQL)

All tables live under the `brand_tracker` schema using Drizzle's `pgSchema`.
Schema designed to match real LinkedIn Analytics exports (aggregate 6-month report + per-post manual exports).

### Tables (7)

**brand_tracker.profiles** — One per platform
- `id` (uuid, PK, `gen_random_uuid()`)
- `platform` (text, not null, unique) — "linkedin", etc.
- `handle` (text, nullable) — LinkedIn export doesn't provide this
- `display_name` (text, nullable)
- `avatar_url` (text, nullable) — future use
- `created_at` (timestamp, not null, default now)

**brand_tracker.imports** — One per file upload
- `id` (uuid, PK, `gen_random_uuid()`)
- `platform` (text, not null)
- `source` (text, not null) — "linkedin_analytics", "linkedin_post", "favikon", "manual"
- `file_name` (text, not null)
- `period_start` (date, nullable) — from aggregate report header
- `period_end` (date, nullable) — from aggregate report header
- `total_impressions` (integer, nullable) — Sheet 1 summary
- `total_members_reached` (integer, nullable) — Sheet 1 summary
- `total_followers_at_end` (integer, nullable) — Sheet 4 header
- `row_count` (integer, nullable)
- `status` (text, not null) — "pending", "processing", "completed", "failed"
- `error_message` (text, nullable)
- `created_at` (timestamp, not null, default now)

**brand_tracker.daily_metrics** — Merges engagement (Sheet 2) + followers (Sheet 4)
- `id` (uuid, PK, `gen_random_uuid()`)
- `platform` (text, not null)
- `date` (date, not null)
- `impressions` (integer, nullable)
- `interactions` (integer, nullable)
- `new_followers` (integer, nullable)
- `profile_views` (integer, nullable) — future
- `created_at` (timestamp, not null, default now)
- `updated_at` (timestamp, not null, default now)
- Unique: `(platform, date)` — upsert on re-import

**brand_tracker.posts** — Merged from aggregate top-50 + per-post exports
- `id` (uuid, PK, `gen_random_uuid()`)
- `platform` (text, not null)
- `platform_id` (text, not null) — numeric ID extracted from activity URN URL
- `url` (text, nullable)
- `published_at` (date, not null)
- `published_time` (text, nullable) — "18:49", per-post export only
- `content` (text, nullable) — future: scraped or manual
- `content_type` (text, nullable) — "text", "image", "video", "carousel"
- *From aggregate report:* `impressions`, `interactions` (integer, nullable)
- *From per-post export:* `members_reached`, `reactions`, `comments`, `shares`, `saves`, `link_clicks`, `profile_views_from_post`, `followers_from_post`, `sends` (integer, nullable)
- *Video metrics:* `video_views`, `video_watch_time_seconds`, `video_avg_watch_seconds` (integer, nullable)
- `engagement_rate` (real, nullable)
- `created_at`, `updated_at` (timestamp, not null, default now)
- Unique: `(platform, platform_id)` — upsert on re-import
- URL matching: both exports share the same numeric ID at the end of the URN

**brand_tracker.post_link_clicks** — Per-URL click breakdown from per-post exports
- `id` (uuid, PK, `gen_random_uuid()`)
- `post_id` (uuid, FK → posts, not null)
- `url` (text, not null) — the external URL that was clicked
- `clicks` (integer, not null)
- `created_at` (timestamp, not null, default now)
- Unique: `(post_id, url)`

**brand_tracker.post_engagement_highlights** — Per-post audience highlights
- `id` (uuid, PK, `gen_random_uuid()`)
- `post_id` (uuid, FK → posts, not null)
- `engagement_type` (text, not null) — "reaction", "comment", "share"
- `period_start` (date, nullable) — highlight date range start
- `period_end` (date, nullable) — highlight date range end
- `top_job_title` (text, nullable)
- `top_location` (text, nullable)
- `top_industry` (text, nullable)
- `created_at` (timestamp, not null, default now)
- Unique: `(post_id, engagement_type)`

**brand_tracker.demographics_snapshots** — Audience breakdown (per-import or per-post)
- `id` (uuid, PK, `gen_random_uuid()`)
- `import_id` (uuid, FK → imports, nullable) — for aggregate report Sheet 5
- `post_id` (uuid, FK → posts, nullable) — for per-post export Sheet 2
- `platform` (text, not null)
- `category` (text, not null) — "job_title", "location", "industry", "seniority", "company_size", "company"
- `value` (text, not null)
- `percentage` (real, not null) — stored as float (22.0 not "22%")
- `created_at` (timestamp, not null, default now)
- Unique: `(import_id, post_id, platform, category, value)`

---

## Implementation Steps

### Phase 1: Project Setup ✅
1. ~~Create Next.js project with TypeScript, Tailwind, App Router~~
2. ~~Install dependencies: drizzle-orm, postgres (postgres.js driver), next-auth, recharts, papaparse, shadcn/ui, drizzle-kit~~
3. ~~Configure Drizzle with `pgSchema('brand_tracker')` + postgres.js driver pointing to Supabase connection string~~
4. ~~Configure Drizzle schema + run initial migration (creates `brand_tracker` schema + tables)~~
5. Set up NextAuth with credentials provider — *configured but not protecting routes yet*
6. ~~Create `.env.example` with: `DATABASE_URL` (Supabase connection string), `NEXTAUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD`~~

### Phase 2: Data Pipeline ✅ (CLI) / Partial (UI)
1. Build CSV upload UI (dropzone component on `/import` page) — **not yet built**
2. ~~Build parsing logic:~~
   - ~~LinkedIn Analytics `.xlsx` parser (aggregate report with 5 sheets)~~
   - ~~LinkedIn per-post `.xlsx` parser (detailed post metrics)~~
   - Favikon parser — **not yet built**
   - Generic parser (let user map columns manually) — **not yet built**
3. ~~CLI import script to parse → validate → upsert into Supabase (brand_tracker schema)~~
4. Import history table showing past imports with status — **not yet built (UI)**

### Phase 3: Dashboard ✅ (Single-page MVP)
1. ~~Dashboard layout (single-page, dark theme with shadcn/ui)~~
2. ~~**Overview**: KPI cards (total followers, avg engagement rate, total impressions, post count)~~
3. ~~**Posts table**: Top posts with impressions, content preview~~
4. ~~**Daily metrics chart**: Impressions + interactions over time~~
5. ~~**Audience demographics**: Job title, location, industry breakdowns~~
6. ~~**Video stats**: Watch time, views, average duration~~
7. Date range filter — **not yet built**

### Phase 4: Polish & Template-ify — Partial
1. Seed script with demo data — **not yet built**
2. ~~README with setup guide~~
3. ~~`.env.example` with comments~~
4. One-click deploy button for Vercel — **not yet added**

---

## Verification

1. **Auth**: Login with credentials from env vars, verify protected routes redirect — *pending: auth not wired*
2. ~~**Data Import**: Run `pnpm import:linkedin` with LinkedIn exports → verify data appears in Supabase (`brand_tracker` schema)~~
3. ~~**Dashboard**: Verify charts render with imported data, KPIs calculate correctly~~
4. ~~**Schema isolation**: All tables are under `brand_tracker` schema, not polluting `public`~~
5. ~~**Deploy**: Push to Vercel, verify Supabase connection works, dashboard renders from deployed app~~
6. **Clone test**: Follow README from scratch on a clean setup to verify the template flow — *pending*
