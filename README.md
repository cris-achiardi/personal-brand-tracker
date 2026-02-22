# Personal Brand Tracker

A personal brand analytics dashboard for tracking LinkedIn growth over time. Import your LinkedIn Analytics exports, and view engagement trends, top posts, audience demographics, and more in a clean dark-themed dashboard.

Built as a cloneable template — fork it, deploy it, and use it to track your own brand.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: Supabase PostgreSQL (free tier) via Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS 4
- **Charts**: Recharts
- **Auth**: NextAuth v5 (Auth.js)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) package manager
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Clone and install

```bash
git clone <your-fork-url> personal-brand-tracker
cd personal-brand-tracker
pnpm install
```

### 2. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (use the "Transaction" pooler URL) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `AUTH_USERNAME` | Login username (credentials auth) |
| `AUTH_PASSWORD` | Login password (credentials auth) |

### 3. Run database migrations

```bash
pnpm exec drizzle-kit push
```

This creates the `brand_tracker` schema and all 7 tables in your Supabase database.

### 4. Import your LinkedIn data

Place your LinkedIn Analytics `.xlsx` export files in a `data/` folder at the project root, then run:

```bash
pnpm import:linkedin
```

The script parses both aggregate analytics reports and per-post export files automatically.

To enrich posts with readable URLs and content:

```bash
pnpm fetch:content
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `pnpm dev` | Start Next.js development server |
| Build | `pnpm build` | Production build |
| Import data | `pnpm import:linkedin` | Parse and import LinkedIn `.xlsx` exports from `data/` |
| Fetch content | `pnpm fetch:content` | Enrich posts with readable URLs and content |
| DB push | `pnpm exec drizzle-kit push` | Push schema changes to database |
| DB studio | `pnpm exec drizzle-kit studio` | Open Drizzle Studio to browse your data |

## Deployment

### Vercel

1. Push your repo to GitHub
2. Import it in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` — your Supabase connection string
   - `NEXTAUTH_SECRET` — a random secret string
   - `AUTH_USERNAME` and `AUTH_PASSWORD` — your login credentials
4. Deploy

The dashboard uses dynamic rendering (`force-dynamic`) so it always queries fresh data from Supabase.

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Server component — queries DB
│   ├── dashboard.tsx     # Client component — charts & tables
│   ├── layout.tsx        # Root layout (dark theme)
│   └── globals.css       # Tailwind 4 + theme variables
├── components/ui/        # shadcn/ui components
├── lib/
│   ├── db/schema.ts      # Drizzle schema (7 tables)
│   ├── db/client.ts      # Database client
│   └── parsers/          # LinkedIn export parsers
└── scripts/              # CLI import & enrichment scripts
```

## License

MIT
