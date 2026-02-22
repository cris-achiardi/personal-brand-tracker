# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-02-21

### Added

#### Dashboard
- Single-page analytics dashboard with dark theme using shadcn/ui
- KPI cards: total followers, impressions, engagement rate, post count
- Engagement trend chart (impressions + interactions over time)
- Top posts table with content preview and sortable columns
- Daily metrics chart (impressions + interactions by day)
- Audience demographics breakdown (job title, location, industry)
- Video performance stats (views, watch time, average duration)
- Force-dynamic rendering for fresh data on every page load

#### Data Pipeline
- LinkedIn Analytics `.xlsx` parser supporting all 5 sheets:
  - Sheet 1: Summary metrics (impressions, members reached)
  - Sheet 2: Daily engagement data (impressions, interactions)
  - Sheet 3: Top 50 posts (from aggregate report)
  - Sheet 4: Follower data (daily new followers, total count)
  - Sheet 5: Audience demographics (job title, location, industry, seniority, company size)
- LinkedIn per-post `.xlsx` parser for detailed post metrics (reactions, comments, shares, saves, link clicks, video stats)
- CLI import script (`pnpm import:linkedin`) that auto-detects file type and upserts data
- Post content fetcher script (`pnpm fetch:content`) to enrich posts with readable URLs

#### Database
- 7-table schema under `brand_tracker` PostgreSQL schema via Drizzle ORM:
  - `profiles`, `imports`, `daily_metrics`, `posts`, `post_link_clicks`, `post_engagement_highlights`, `demographics_snapshots`
- All tables use upsert semantics for safe re-imports
- Schema isolation using Drizzle's `pgSchema` (does not pollute `public` schema)

#### Infrastructure
- Next.js 16 project with App Router, React 19, TypeScript
- Drizzle ORM with postgres.js driver connecting to Supabase
- NextAuth v5 configured (credentials provider)
- shadcn/ui components: card, badge, button, input, toggle, toggle-group
- Tailwind CSS 4 with dark theme
- Deployed to Vercel
