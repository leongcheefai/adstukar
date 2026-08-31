# AdsTukar

Ship paid SaaS faster, without lock-in.

## Stack

| Layer | Tech |
|---|---|
| Monorepo | pnpm + Turborepo |
| Marketing | Astro + React islands |
| Dashboard | Vite + React + React Router + TanStack Query |
| API | Hono on Node |
| Database | Postgres + Drizzle ORM |
| Auth | Better Auth |
| Payments | Stripe |
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
- Marketing: http://localhost:4321

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
