# Personal Brand Tracker - Implementation Plan

## Context

Build a personal brand tracker as a **cloneable template** that anyone can fork, deploy, and use to track their social media brand growth. Starting with LinkedIn data (via CSV imports from LinkedIn Analytics exports and Favikon). LinkedIn's API is locked down for individual developers (no access to post metrics/engagement), so CSV import is the primary and safest data ingestion method.

Deployed on Vercel with Supabase PostgreSQL as the database (free tier, 500MB). Uses a dedicated `brand_tracker` PostgreSQL schema so one Supabase project can host multiple small apps. Non-technical users should be able to fork, deploy, and import CSVs from any device.

---

## Decisions Made

- **Stack**: Next.js (App Router) + Drizzle ORM + Supabase (PostgreSQL) + NextAuth + Recharts
- **Database**: Supabase PostgreSQL (free tier, 500MB) — shared project via `brand_tracker` schema, reuse for other projects
- **Auth**: NextAuth with credentials provider (hardcoded from env vars, optionally swap to OAuth)
- **Data ingestion**: CSV import (Favikon exports, LinkedIn Analytics page exports, generic CSV)
- **Schema**: Multi-platform from day 1 (platform field on all tables), LinkedIn UI only for PoC
- **Deployment**: Vercel (free hobby tier)
- **First milestone**: CSV import + dashboard + auth (full core loop)

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 15 (App Router) | Full-stack, auth support, server actions for CSV processing |
| ORM | Drizzle | First-class PostgreSQL support, lightweight, type-safe, `pgSchema` for namespacing |
| Database | Supabase (PostgreSQL) | Free tier 500MB, shared across projects via schemas, managed, works with Vercel |
| Auth | NextAuth v5 (Auth.js) | Simple credentials provider, optionally OAuth |
| Charts | Recharts | React-native, composable, good for dashboards |
| UI | shadcn/ui + Tailwind | Cloneable components, easy to customize |
| CSV parsing | Papa Parse | Battle-tested CSV parser for browser + Node |
| Deployment | Vercel | Free tier, seamless Next.js integration |

---

## Project Structure

```
brand-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing / redirect to dashboard
│   │   ├── (auth)/
│   │   │   └── login/page.tsx        # Login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Dashboard layout (sidebar + nav)
│   │   │   ├── page.tsx              # Overview (KPI cards + trends)
│   │   │   ├── posts/page.tsx        # Posts table + performance charts
│   │   │   ├── growth/page.tsx       # Follower/views growth over time
│   │   │   └── import/page.tsx       # CSV upload + import history
│   │   └── api/
│   │       └── import/route.ts       # CSV upload endpoint
│   ├── components/
│   │   ├── charts/                   # Recharts wrappers (line, bar, area)
│   │   ├── dashboard/                # KPI cards, stat cards, data tables
│   │   ├── import/                   # CSV upload dropzone, column mapper
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema definitions
│   │   │   ├── client.ts            # Supabase/Drizzle client (postgres.js driver)
│   │   │   └── queries.ts           # Reusable query functions
│   │   ├── parsers/
│   │   │   ├── linkedin.ts          # LinkedIn Analytics CSV parser
│   │   │   ├── favikon.ts           # Favikon CSV parser
│   │   │   └── generic.ts           # Generic CSV mapper
│   │   └── auth.ts                  # NextAuth config
│   └── types/
│       └── index.ts                 # Shared TypeScript types
├── drizzle/
│   └── migrations/                  # Drizzle migration files
├── drizzle.config.ts
├── .env.example                     # Template env vars for cloning
├── package.json
└── README.md                        # Setup guide for forking
```

---

## Database Schema (Drizzle + Supabase PostgreSQL)

All tables live under the `brand_tracker` schema using Drizzle's `pgSchema`:

```ts
import { pgSchema, uuid, text, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const brandTracker = pgSchema('brand_tracker');
```

### Tables

**brand_tracker.profiles**
- `id` (uuid, PK, `gen_random_uuid()`)
- `platform` (text, not null) — "linkedin", "twitter", "youtube", etc.
- `handle` (text, not null) — username or profile URL
- `displayName` (text)
- `createdAt` (timestamp, default now)

**brand_tracker.posts**
- `id` (uuid, PK, `gen_random_uuid()`)
- `profileId` (uuid, FK → profiles)
- `platform` (text, not null)
- `externalId` (text, nullable) — platform's own post ID
- `content` (text, nullable) — post text/title
- `contentType` (text, not null) — "text", "image", "video", "carousel", "article"
- `publishedAt` (timestamp, not null)
- `url` (text, nullable)
- `createdAt` (timestamp, default now)

**brand_tracker.post_metrics**
- `id` (uuid, PK, `gen_random_uuid()`)
- `postId` (uuid, FK → posts)
- `impressions` (integer)
- `likes` (integer)
- `comments` (integer)
- `shares` (integer)
- `clicks` (integer, nullable)
- `engagementRate` (real, nullable)
- `snapshotDate` (timestamp, not null) — when this data was captured
- `createdAt` (timestamp, default now)

**brand_tracker.profile_metrics**
- `id` (uuid, PK, `gen_random_uuid()`)
- `profileId` (uuid, FK → profiles)
- `followers` (integer)
- `profileViews` (integer, nullable)
- `connections` (integer, nullable)
- `snapshotDate` (timestamp, not null)
- `createdAt` (timestamp, default now)

**brand_tracker.imports**
- `id` (uuid, PK, `gen_random_uuid()`)
- `source` (text, not null) — "linkedin_analytics", "favikon", "manual", "generic"
- `fileName` (text, not null)
- `rowCount` (integer)
- `status` (text, not null) — "pending", "completed", "failed"
- `createdAt` (timestamp, default now)

---

## Implementation Steps

### Phase 1: Project Setup
1. Create Next.js project with TypeScript, Tailwind, App Router
2. Install dependencies: drizzle-orm, postgres (postgres.js driver), next-auth, recharts, papaparse, shadcn/ui, drizzle-kit
3. Configure Drizzle with `pgSchema('brand_tracker')` + postgres.js driver pointing to Supabase connection string
4. Configure Drizzle schema + run initial migration (creates `brand_tracker` schema + tables)
5. Set up NextAuth with credentials provider
6. Create `.env.example` with: `DATABASE_URL` (Supabase connection string), `NEXTAUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD`

### Phase 2: Data Pipeline
1. Build CSV upload UI (dropzone component on `/import` page)
2. Build CSV parsing logic:
   - LinkedIn Analytics parser (map known column names)
   - Favikon parser (map Favikon export format)
   - Generic parser (let user map columns manually)
3. Server action to parse CSV → validate → insert into Supabase (brand_tracker schema)
4. Import history table showing past imports with status

### Phase 3: Dashboard
1. Dashboard layout (sidebar nav + main content area)
2. **Overview page**: KPI cards (total followers, avg engagement rate, total impressions, post count) + trend sparklines
3. **Posts page**: Sortable/filterable data table of all posts + engagement bar charts
4. **Growth page**: Line charts for followers over time, profile views over time
5. Import page (built in Phase 2)

### Phase 4: Polish & Template-ify
1. Seed script with demo data (so new users see a populated dashboard)
2. README with step-by-step fork/deploy guide
3. `.env.example` with clear comments
4. One-click deploy button for Vercel

---

## Verification

1. **Auth**: Login with credentials from env vars, verify protected routes redirect
2. **CSV Import**: Upload a sample LinkedIn/Favikon CSV → verify data appears in Supabase (`brand_tracker` schema)
3. **Dashboard**: Verify charts render with imported data, KPIs calculate correctly
4. **Schema isolation**: Verify all tables are under `brand_tracker` schema, not polluting `public`
5. **Deploy**: Push to Vercel, verify Supabase connection works, CSV import works from deployed app
6. **Clone test**: Follow README from scratch on a clean setup to verify the template flow
