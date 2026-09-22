# AdsTukar

Show two ads, earn one for yourself. A cross-promotion ad exchange for indie hackers:
register a product, paste one snippet, show a small sponsored card for another member's
product, and earn points to show yours in theirs. No money moves in v1.

How it works: every verified impression a host shows earns +1 point (settles after 24 h);
every impression of a member's own card costs −2. A human moderation queue approves each
product before it serves. Every number lives in `packages/config/src/economy.ts`.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm + Turborepo |
| Marketing | Astro + React islands |
| Dashboard | Vite + React + React Router + TanStack Query |
| API | Hono on Node |
| Embed | Vanilla TS snippet, Vite library mode, < 10 kB gzip |
| Database | Postgres + Drizzle ORM |
| Auth | Better Auth |
| Payments | Stripe (dormant in v1 — no money moves) |
| Email | Resend + React Email |
| UI | shadcn/ui + Tailwind CSS |

## Prerequisites

- Node 22+ (`nvm use` picks it up from `.nvmrc`)
- Corepack or pnpm 9+
- Docker running locally (for Postgres)

## Local setup

```bash
# Install dependencies, create .env, start Postgres, and push the schema
node scripts/bootstrap.mjs

# Start all dev servers
pnpm dev
```

The bootstrap is safe to run again: it preserves an existing `.env`, while
dependency installation, Docker Compose, and the schema push are idempotent.
Stripe, Resend, Google OAuth, S3, and GitHub feedback remain disabled until
their optional values are added to the root `.env`.

Open:
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- CapyTV: http://localhost:3002
- Marketing: http://localhost:4321
- Embed playground: http://localhost:3001/embed/playground.html?key=<placement api key> (after the embed builds)

First run: `pnpm db:seed` creates the admin who approves listings and devices.

- **To advertise**: book a slot under Campaigns, verify its domain, and approve
  the creative under Settings → Moderation. The slot's term starts then.
- **To distribute**: register a device with a photo of the screen through the
  API (the dashboard has no device page yet), approve it through
  `POST /admin/devices/:id/approve`, add a region to it, then open CapyTV and
  paste the device key. A running slot plays on it.

## Commands

| Command | Description |
|---|---|
| `pnpm bootstrap` | Repeat the dependency, environment, Postgres, and schema setup |
| `pnpm launch:check -- --env <path>` | Check identity, production env, content, and integrations before launch |
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm verify` | Lint + typecheck + test + build (what CI and the pre-push hook run) |
| `pnpm db:up` | Start local Postgres |
| `pnpm db:down` | Stop local Postgres |
| `pnpm db:push` | Push schema to DB (dev only) |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Create the first admin user, or promote an existing user to admin |
| `pnpm --filter @repo/embed build` | Build the embed bundle and check its size budget |
| `pnpm --filter @repo/api jobs:run` | Run ledger settlement and expiry once (for an external cron) |

## Branding

Edit `packages/config/src/project.ts` to set the product name, slug, tagline,
description, canonical site URL, and email addresses. The internal `@repo/*`
package scope is intentionally neutral and should not be renamed.

Edit `packages/ui/src/styles/tokens.css` to change the visual theme.

## Launch readiness

Create an ignored production environment file from `.env.example`, fill in the
real deployment values, then run the static launch checks and the code-quality
gate:

```bash
cp .env.example .env.production
pnpm launch:check -- --env .env.production
pnpm verify
```

The launch checker is read-only and never prints environment values. It blocks
unchanged template identity, local or inconsistent deployment URLs, a local
database, placeholder marketing or legal copy, and partially configured Google,
Stripe, S3/R2, or GitHub integrations. Optional integrations may remain entirely
unset.
