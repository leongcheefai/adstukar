# SaaS Boilerplate — Kickstart Prompt for Claude Code

> [!NOTE]
> Historical planning record. This was the initial build brief and intentionally
> preserves assumptions that changed during implementation. Use the root
> `README.md` for setup and commands, and the nearest `CLAUDE.md` for current
> architecture and contributor guidance.

> Original instruction, retained for context: copy everything below this line
> into Claude Code as the first build prompt.

---

# Build: Vite + Hono SaaS Boilerplate

You are building a production-ready, sellable SaaS boilerplate for indie hackers — similar in spirit to ShipFast, but built on a Vite + Hono + Better Auth stack instead of Next.js. The end goal is a codebase that an indie hacker can clone, configure in under 30 minutes, and ship a paid SaaS on top of.

## Project Overview

- **Working name**: `praxor-kit` (placeholder — will be confirmed before public launch)
- **Tagline**: Ship paid SaaS faster, without lock-in.
- **Target User**: Indie hackers and small agencies who want a typed, lightweight, AI-coding-friendly SaaS starter that isn't tied to Next.js, Vercel, or any single auth/DB vendor.
- **Distribution model**: Sold via private GitHub repo access (Stripe payment → buyer added as collaborator). Out of scope for v1 — focus only on the codebase itself.

## Architecture

A pnpm + Turborepo monorepo with **three apps** and **six shared packages**.

```
.
├── apps/
│   ├── web/              # Astro — marketing site + blog (static)
│   ├── app/              # Vite + React — authenticated dashboard (SPA)
│   └── api/              # Hono on Node — backend API
├── packages/
│   ├── ui/               # Design system: tokens, shadcn primitives, SaaS patterns, Tailwind preset
│   ├── db/               # Drizzle ORM schema + migrations + client
│   ├── auth/             # Better Auth configuration (server + client exports)
│   ├── emails/           # React Email templates + Resend sender
│   ├── env/              # @t3-oss/env-core runtime env validation
│   └── config/           # Project identity + shared tsconfig and Biome config
├── .claude/
│   └── commands/         # Slash commands for buyers (see below)
├── docker-compose.yml    # Local Postgres
├── turbo.json
├── pnpm-workspace.yaml
├── biome.json
├── .nvmrc                # Node 22
├── CLAUDE.md             # Root onboarding for Claude Code
└── README.md
```

## Tech Stack (locked — do not substitute)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 22 LTS | Pinned via `.nvmrc` and `engines` |
| Package manager | pnpm | Workspaces required |
| Monorepo | Turborepo | Standard pipelines: dev, build, lint, typecheck |
| Language | TypeScript (strict) | Single base tsconfig in `packages/config` |
| Linter/formatter | Biome | Single tool, no ESLint + Prettier |
| Marketing site | Astro + React islands | Static-first for SEO; React only where interactive |
| Dashboard | Vite + React + React Router + TanStack Query | SPA, client-side auth gating |
| Backend | Hono on Node (`@hono/node-server`) | Module-based folder convention (see below) |
| Validation | Zod | Used in API routes and frontend forms |
| Database | Postgres + Drizzle ORM | Local via Docker; production-agnostic |
| Auth | Better Auth | Self-hosted, owns users table, no vendor lock-in |
| Payments | Stripe | Subscriptions + Customer Portal + webhooks |
| Email | Resend + React Email | Templates in `packages/emails` |
| UI | shadcn/ui (Radix-based) + Tailwind CSS | Customized into `packages/ui` |
| Local Postgres | Docker Compose | One-command spin-up |

**Do not introduce**: Next.js, NestJS, Prisma, NextAuth, Clerk, Supabase Auth, tRPC, ESLint, Prettier, Yarn, npm, Express, Fastify. The whole point is the chosen stack — substitutions defeat the product.

## MVP Features (must-have for v1)

These are the features the boilerplate must deliver out of the box:

- **Auth flows**: Email/password sign-up, sign-in, sign-out, password reset, email verification, Google OAuth — all via Better Auth.
- **Stripe billing**: Pricing page on `web`, Checkout session creation, Customer Portal access, webhook handler covering `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Subscription state synced to DB.
- **Dashboard shell**: Sidebar + topbar layout, protected routes, profile page, billing page (current plan + Manage Subscription button).
- **Marketing site**: Hero, features, pricing, FAQ, testimonials, footer, blog (Astro content collections with one placeholder post), legal pages (terms, privacy).
- **Transactional emails**: Welcome, email verification, password reset, payment failed — all via Resend with React Email templates.
- **Design system**: Token-based theming via CSS variables, dark mode, shadcn primitives customized to brand, 8–10 SaaS-specific patterns (DashboardShell, PricingCard, FeatureSection, LogoCloud, Testimonial, FAQ, EmptyState, StatCard, PageHeader, BillingPanel).
- **AI-ready onboarding**: Scoped CLAUDE.md files at every meaningful directory + `.claude/commands/` slash commands for common tasks.

## Conventions

### API folder convention (Hono)

Impose light NestJS-style separation without the framework weight:

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts        # Hono router for this module
│   │   ├── auth.service.ts       # Business logic
│   │   └── auth.schema.ts        # Zod schemas
│   ├── billing/
│   ├── users/
│   └── health/
├── lib/
│   ├── app.ts                    # Hono app instance + global middleware
│   ├── stripe.ts                 # Stripe client
│   └── logger.ts
├── middleware/
│   ├── auth.ts                   # Better Auth session check
│   └── error.ts                  # Global error handler
└── index.ts                      # Server entry
```

Every module exports a Hono router that's mounted in `lib/app.ts`. New endpoints always create or extend a module — never add routes directly to `app.ts`.

### Design tokens (CSS variables)

All theme values live in `packages/ui/src/styles/tokens.css` as HSL CSS custom properties. The Tailwind preset in `packages/ui/tailwind.preset.ts` references them via `hsl(var(--token-name))`. Buyers retheme by editing `tokens.css` only — never the Tailwind config.

Required token groups: colors (background, foreground, primary, secondary, muted, accent, destructive, border, input, ring, card, popover — each with foreground variant where applicable), radius, font families. Dark mode via `.dark` class selector.

### Env validation

All env access goes through `packages/env`. Each app re-exports a typed env object built with `@t3-oss/env-core`. Apps must never read `process.env` directly.

### Module ownership

| Concern | Owned by |
|---|---|
| Auth config (server + client) | `packages/auth` |
| Drizzle schema + migrations | `packages/db` |
| Email templates + sender | `packages/emails` |
| UI tokens + components + Tailwind preset | `packages/ui` |
| Public product identity | `packages/config/src/project.ts` |
| Env schemas | `packages/env` |
| HTTP routes | `apps/api/src/modules/*` |
| Marketing pages | `apps/web/src/pages/*` |
| Dashboard pages | `apps/app/src/routes/*` |

### Project identity

Use `Praxor Kit` as the default identity in `packages/config/src/project.ts`. Apps consume that module for the product name, slug, tagline, site URL, and email addresses. Keep `@repo/*` as the permanent neutral package scope; buyers should never need to rename imports when rebranding.

### Brand archetype (provisional, until confirmed)

- **Feel**: Technical / serious — closer to Linear or Vercel than Notion.
- **Primary color**: Indigo (`hsl(243 75% 59%)`) as default; document how to swap.
- **Typography**: Geist (UI) + Geist Mono (code). Self-hosted via `@fontsource-variable/geist`.
- **Radius**: Medium (`0.5rem`).
- **Density**: Balanced — not as compact as Linear, not as airy as Stripe.

These four decisions live at the top of `packages/ui/CLAUDE.md` and drive every component decision.

## Build Sequence

Build in the following phases. Each phase must end in a runnable, committable state. **Stop at the end of each phase, summarize what was built, and wait for confirmation before continuing.**

### Phase 1 — Monorepo skeleton ✅
- pnpm + Turborepo + workspaces
- `packages/config` (project identity, tsconfig.base.json, biome.json)
- `packages/env` skeleton (no schemas yet)
- Empty `apps/web`, `apps/app`, `apps/api` directories with their own `package.json`
- `docker-compose.yml` with Postgres 16
- Root `CLAUDE.md`, `README.md`, `.gitignore`, `.nvmrc`
- Scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm db:up`, `pnpm db:down`
- Commit: `chore: initial monorepo skeleton`

**Done when**: `pnpm install && pnpm typecheck` passes on empty packages.

### Phase 2 — Database layer (`packages/db`) ✅
- Drizzle + drizzle-kit installed
- `drizzle.config.ts` reading from `packages/env`
- Schema: `users`, `sessions`, `accounts`, `verificationTokens` (Better Auth tables) + `subscriptions` (Stripe sync)
- Exports: `db` client, `schema`, type helpers
- Scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`

**Done when**: `pnpm db:push` creates all tables in local Postgres.

### Phase 3 — API skeleton (`apps/api`) ✅
- Hono + `@hono/node-server` + Zod
- Module convention scaffolded with `health` module
- Global middleware: CORS, logger, error handler
- Env validation wired via `packages/env`

**Done when**: `curl http://localhost:3001/health` returns `{ ok: true }`.

### Phase 4 — Auth (`packages/auth` + `apps/api`) ✅
- Better Auth configured with Drizzle adapter
- Email/password + Google OAuth enabled
- Better Auth handler mounted at `/api/auth/*` in `apps/api`
- Session middleware in `apps/api/src/middleware/auth.ts`

**Done when**: signup → signin → protected route works via curl with cookies.

### Phase 5 — Design system foundation (`packages/ui`) ✅
- `tokens.css` with full token set (light + dark)
- `tailwind.preset.ts` referencing tokens
- `globals.css` with Tailwind layers
- Geist fonts wired
- shadcn `components.json` configured to write into `packages/ui/src/primitives`
- Initial primitives: Button, Input, Label, Card, Dialog, DropdownMenu, Sonner (toast), Tooltip — customized to tokens
- `cn()` utility in `packages/ui/src/lib/utils.ts`

**Done when**: a sample app importing `@repo/ui` renders a themed Button correctly with dark mode toggle.

### Phase 6 — Dashboard app (`apps/app`) ✅
- Vite + React + React Router + TanStack Query
- Better Auth React client wired
- Routes: `/login`, `/signup`, `/forgot-password`, `/dashboard`, `/dashboard/billing`, `/dashboard/settings`
- Protected route wrapper using session hook
- DashboardShell pattern in `packages/ui/patterns` consumed here
- `_dev/components` route gated to dev mode showing every primitive + pattern

**Done when**: full signup → dashboard flow works locally end-to-end.

### Phase 7 — Marketing site (`apps/web`) ✅
- Astro with React + Tailwind integrations
- Pages: `/` (landing), `/pricing`, `/blog`, `/blog/[slug]`, `/terms`, `/privacy`
- Patterns consumed from `packages/ui`: Hero, FeatureSection, PricingCard, LogoCloud, Testimonial, FAQ
- Astro content collection for blog with one placeholder post
- SEO: sitemap integration, OG image generator, robots.txt

**Done when**: `pnpm --filter web build` produces a static site that scores 95+ on Lighthouse.

### Phase 8 — Stripe billing ✅
- `apps/api/src/modules/billing/` with Checkout, Portal, Webhook routes
- All four critical webhook events handled and synced to `subscriptions` table
- `apps/app/dashboard/billing` shows current plan + Manage button
- Stripe CLI usage documented in `apps/api/CLAUDE.md`

**Done when**: full paid signup flow works in Stripe test mode and DB reflects subscription state.

### Phase 9 — Emails (`packages/emails`) ✅
- React Email + Resend SDK
- Templates: welcome, verify-email, reset-password, payment-failed
- Sender service in `apps/api`
- Wired into Better Auth flows + Stripe webhooks

**Done when**: signup triggers a real Resend email in dev with the welcome template.

### Phase 10 — AI-ready polish ✅
- Scoped `CLAUDE.md` in: root, `apps/web`, `apps/app`, `apps/api`, `packages/ui`, `packages/db`, `packages/auth`, `packages/emails`
- `.claude/commands/`: `/add-api-route`, `/add-dashboard-page`, `/add-stripe-product`, `/add-email-template`, `/add-marketing-section`
- README walks a buyer from `git clone` to running locally in under 5 minutes
- `.env.example` files at every app/package that needs env

**Done when**: a fresh clone + following README gets a buyer to a working local stack.

## CLAUDE.md Strategy

Every CLAUDE.md file follows the same template:

```md
# <Scope name>

## Purpose
One paragraph: what lives here and why.

## Conventions
- Bullet list of rules specific to this directory.

## Common tasks
- "Add a new X" → step-by-step.
- "Modify Y" → step-by-step.

## Gotchas
- Things that will trip up someone new.
```

Claude Code reads the nearest CLAUDE.md, so scoped files give the right context per workspace. This is itself a selling point — market the boilerplate as "Claude Code-ready."

## Constraints

- **No vendor lock-in**: every external service (Stripe, Resend, Google OAuth, Postgres host) must be swappable by editing a single config file or env var. No service should be baked into business logic.
- **Self-hostable end to end**: the entire stack must run on a buyer's own infrastructure with only Stripe and Resend as external dependencies.
- **Strict TypeScript everywhere**: no `any`, no `@ts-ignore` without an inline comment justifying it.
- **No client-side secrets**: env vars exposed to `apps/web` and `apps/app` must be explicitly prefixed and validated as public.
- **Accessibility**: all interactive components keyboard-navigable, focus-visible, ARIA-correct (shadcn primitives handle most of this — don't break it).
- **Performance**: marketing site must score 95+ on Lighthouse mobile. Dashboard initial JS bundle under 250KB gzipped.
- **No premature abstraction**: build patterns when a second app needs them, not preemptively.
- **Commit hygiene**: conventional commits (`feat:`, `chore:`, `fix:`, `docs:`), small focused commits, never mix phases in one commit.

## What to do first

1. Confirm you understand the architecture and stack.
2. Ask me only the questions you genuinely cannot proceed without (don't ask about things already specified above).
3. Begin **Phase 1** — monorepo skeleton — and stop at the end of the phase for review.

Do not skip phases. Do not introduce dependencies not listed in the stack. Do not generate placeholder content (`Lorem ipsum`, `John Doe`) for the marketing site — leave clearly-labeled `TODO: copy` slots so I can write real copy later.

Begin.
