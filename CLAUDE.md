# CapyAds

## Purpose
CapyAds is an ad network for small screens. An advertiser pays points to have listings played on screens that other members own. The screen owner earns points from each play, and converts the earned points into money. Money enters as a top-up and leaves as a payout; points are the only unit inside the system, pegged at 1000 points to 1 USD. Built on the Vite + Hono + Better Auth boilerplate: pnpm + Turborepo monorepo with five apps (`web` landing, `app` dashboard, `api`, `capytv` screen, `embed` snippet) and seven shared packages (`ui`, `db`, `auth`, `emails`, `env`, `config`, `contracts`). Vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`. Roadmap: GitHub issue #5.

## The model
The schema, the contracts, the API, and the dashboard all speak the target
vocabulary: `campaign`, `listing`, `device`, `placement`, `play`. GitHub #11
(Phase 0) renamed them; nothing called `product` or `impression` survives outside
`apps/embed`.

The old barter economy (+1 earn, -2 spend, no money) is dead. Do not restore it.

| Term | What it is |
|---|---|
| `campaign` | one destination site, its verified domain, its state, its daily budget |
| pause reason | why the system stopped a campaign: `budget` or `balance`. A person's pause carries none |
| `listing` | one creative under a campaign, up to four |
| `device` | one screen running CapyTV; owner, venue, tier, location, daily play cap |
| `placement` | one overlay region on a device (`band` / `float` / `ticker`) |
| `play` | one listing shown in one placement for its dwell |
| lot | the origin of a point on a ledger entry: `bought`, `earned`, `granted` |

## Exchange rules (where things live)
- **Economy numbers** — `packages/config/src/economy.ts` only. Play and scan rates, the fee, the peg, grants, the daily play cap, the daily budget default, settlement delay, payout hold and threshold, expiry, top-up packs, rate limits, listings per campaign. Never a literal in a route, a job, a page, or the client. `apps/embed` is the one exception: it is unmaintained, and its dead web-economy numbers sit in `apps/embed/src/config.ts` so they cannot drift back in.
- **Ledger** — `apps/api/src/modules/ledger/ledger.service.ts` is the only writer of `ledger_entry`. Rows are append-only. `idempotency_key` is unique. Balances are `SUM(delta)`; never store a counter.
- **Point lots** — every entry carries a lot: `bought`, `earned`, or `granted`. The lot decides the rules. `bought` refunds, never withdraws, never expires. `earned` withdraws after the hold, and expires. `granted` neither refunds nor withdraws, and expires. A spend consumes `granted` first, then `bought`, oldest first. A free point that can be withdrawn is a cash faucet.
- **Serve path** — `apps/api/src/modules/serve/`: `ranking.ts` is the pure extension point for AI matching. `GET /serve` opens one play; `GET /loop` opens a whole batch for a screen with a shaky network; `POST /report` counts a play and writes the spend, earn and fee rows in one transaction; `GET /scan/:playId` pays the bonus and redirects. `loop.ts` holds the pure batch rules.
- **The loop** — a play carries its own `expiresAt`, so the void job never has to know which path opened it. A live serve gives minutes; a cached batch gives hours. A queued report sends `playedAt`, and the server clamps it to the life of the play, so a device cannot move its own history.
- **Nothing is priced when a play is served** — the daily cap, the campaign budget, and the state of the campaign and the listing are all read at report time. Above the cap, or on a creative an admin rejected after the batch was cut, the play still shows and still counts, and simply pays nothing. A scan on a still-open play is recorded free and settled by the report that follows it.
- **Pacing** — `apps/api/src/modules/campaigns/pacing.ts` holds the rules, and they are pure. The listings under a campaign split its daily budget evenly. A campaign stops when the budget is spent, and starts again the next day. A campaign stops when the owner's points run out, and starts again when points come back. A pause by a person carries no reason, and the job never touches it.
- **One paid listing at a time** — a device may hold several placements, but only one paid listing is on screen at once. Concurrent regions would charge several advertisers for one pair of eyes.
- **Moderation** — `apps/api/src/modules/admin/`: a human queue. An admin reviews each listing and each device, and a device carries a photo of the screen in place. Device approval also stamps the tier, which sets the rate. The domain check stays automatic and gates the campaign.
- **The distributor's filters** — an excluded term stops anything that reads a certain way; a veto (`vetoed_listing`) stops exactly the creative they looked at. Both live on the device and neither goes through moderation. When nothing paid is eligible, the screen plays the distributor's own promotion (the `promotion*` columns on `device`), or the CapyAds card. Both are free and move no points.
- **Fraud is bounded by policy, not by hardware** — CapyTV is a PWA, so there is no device attestation. Approval, the daily play cap, the payout hold, and the scan-to-play ratio are the whole defence. See `docs/adr/0003`.
- **Jobs** — `apps/api/src/modules/jobs/`: settlement (pending → settled), expiry, and the void of an open play whose report never came. A fourth job paces campaigns. It stops a campaign that can no longer pay, and starts one whose reason to stop has gone. The jobs run in-process (`JOBS_ENABLED=true`), or once with `pnpm --filter @repo/api jobs:run`.
- **CapyTV** — `apps/capytv` is the screen app: a PWA in a kiosk browser (`docs/adr/0003`). It shows thin content (clock, weather from Open-Meteo, an RSS feed the venue sets) and plays listings over it. It holds a loop and a report queue in `localStorage`, so a screen that loses its network keeps playing and reports when the network returns. Pure rules live in `src/lib/{queue,schedule,feed,weather}.ts`; the timers live in `src/lib/player.ts`.
- **Embed** — `apps/embed` serves the old web surface. It stays in the repo, unmaintained. Do not add features to it.

## Conventions
- Package scope: `@repo/*`
- Public product identity comes from `@repo/config/project` — never hardcode the name, site URL, or sender addresses in an app
- API boundary types via `packages/contracts` — never hand-copy a type between `api` and `app`/`web`. One source of truth per type.
- Server env access via `packages/env`; browser-exposed env is validated in `apps/app/src/lib/env.ts` and `apps/web/src/lib/env.ts` — never read `process.env` or `import.meta.env` directly in application code
- Retheme: edit `packages/ui/src/styles/tokens.css` only — never Tailwind config
- Lint/format: Biome only — no ESLint, no Prettier
- TypeScript strict — no `any`, no `@ts-ignore` without inline justification
- Conventional commits: `feat:`, `chore:`, `fix:`, `docs:`
- New deps: check locked stack first — no Next.js, Prisma, Clerk, tRPC, ESLint, Prettier, Express, Fastify, NestJS

## Type contracts (`packages/contracts`)
Single source of truth for every type crossing the API boundary. Hand-copying a type between apps is the bug this package exists to prevent.

- **Layers**: `lib/wire.ts` (codec) → `entities/` (DB-derived) → `inputs/` (request schemas) → `modules/` (per-route responses) → `index.ts` (server values) + `types.ts` (zero-runtime types).
- **Entity contracts derive from the table**: `toWire(createSelectSchema(table).pick({...}))`. Never hand-write a shape a table already owns.
- **`.pick()` is a security allowlist, not style.** `account` holds `password`/`accessToken`/`refreshToken`; `session` holds `token`. Bare `createSelectSchema` on the wire = credential leak. New column never auto-ships.
- **`toWire` encodes serialization**: every `ZodDate` → ISO string. `z.input` = `Date` (drizzle), `z.output` = `string` (wire). Never declare `z.date()` on a response shape by hand — the wire carries a string.
- **API parses every response**: `c.json(contract.output.parse(result satisfies z.input<typeof contract.output>))`. The `satisfies` makes service/contract drift a typecheck failure instead of a 500.
- **`apps/app` + `apps/web` import ONLY `@repo/contracts/types`** — never the root specifier. Root exports values that pull `drizzle-orm/pg-core` into the browser bundle. Biome `noRestrictedImports` enforces this.
- **Enum unions live in `packages/db/src/schema/enums.ts`** as plain `as const` tuples. `pgEnum` and `z.enum` both build from them.
- Hand-author a contract only where no table owns the data (`metrics`, Stripe `invoices`, `billing/config`, `health`, `me`).

## Common tasks
- "Set up a fresh clone" → `node scripts/bootstrap.mjs`; it installs dependencies, creates the root `.env`, starts Postgres, and pushes the schema
- "Rebrand the product" → edit `packages/config/src/project.ts` for identity and `packages/ui/src/styles/tokens.css` for the visual theme; keep the `@repo/*` package scope unchanged
- "Add new API route" → add a contract in `packages/contracts/src/modules/<mod>.ts`, export it from `packages/contracts/src/index.ts` (+ `packages/contracts/src/types.ts` if a frontend needs the type), then `zValidator` the input and `.parse()` the response in the route
- "Add new app" → create `apps/<name>/`, add `package.json` name `@repo/<name>`, add tsconfig extending `@repo/config/tsconfig`, register turbo pipelines
- "Add new package" → create `packages/<name>/`, add `package.json` name `@repo/<name>`, run `pnpm install`
- "Start local DB" → `pnpm db:up`
- "Apply schema changes locally" → `pnpm db:push` (dev DBs are created by push, so `db:migrate` fails on them); still run `pnpm db:generate` so a migration file ships for production
- "Change a point amount, a rate, or a cap" → edit `packages/config/src/economy.ts`; nothing else
- "Run the ledger jobs once" → `pnpm --filter @repo/api jobs:run`
- "Create the first admin" → `pnpm db:seed` (reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, or takes `--email` and `--password`). It signs the user up through Better Auth, then sets `role = 'admin'`. It promotes an existing email instead of failing, and it refuses to run when `NODE_ENV=production`.
- "Run everything locally" → `pnpm bootstrap && pnpm dev`
- "Try CapyTV by hand" → start the API and the dashboard, register a device, approve it under Settings → Moderation, add a region to it, then open `http://localhost:3002/?key=<device key>`
- "Set up a worktree" → from inside it, `pnpm worktree:init` (links the main checkout's `.env`, installs deps). Add `--db` to give it its own database instead of sharing
- "Try a branch a worktree is building" → from the main checkout, `pnpm review <branch>`; `pnpm review --back` returns. Detached checkout, so it works while the worktree holds the branch
- "Run typecheck" → `pnpm typecheck`
- "Check launch readiness" → copy `.env.example` to an ignored production env file, then run `pnpm launch:check -- --env <path>`; run `pnpm verify` separately for the code-quality gate
- "Before commit/push" → `pnpm verify` (lint + typecheck + test + build) must pass — enforced three ways: GitHub Actions on every PR, a native `.githooks/pre-push` hook, and a Claude Code hook
- "Test the old web embed by hand" → build it (`pnpm --filter @repo/embed build`), start the API, open `http://localhost:3001/embed/playground.html?key=<placement api key>`. The embed is unmaintained.

## Gotchas
- **zod dialect split**: `packages/contracts` uses `zod/v4` (`import * as z from "zod/v4"`) because drizzle-zod emits v4 instances. Rest of repo uses v3 (bare `zod`). Both ship inside zod 3.25.76. Bare `zod` in contracts = classes silently don't match. `ZodError` in `apps/api/src/middleware/error.ts` must come from `zod/v4` or the branch never fires. v4 has no `z.AnyZodObject`; `ZodType` is `<Output, Input, Internals>`.
- `toWire` **throws** on schema types outside its allowlist (`.default()`, unions, records, `.refine()`, tuples). Deliberate — silent passthrough would leak a raw `Date` while the type claims `string`. Don't weaken the schema to dodge it.
- A renamed/dropped column makes `.pick()` throw `Unrecognized key` **at module load, not compile time** — TS's excess-property check only fires when every mask key is invalid. Phase 0 renames many columns, so expect this one.
- `pgEnum` without `.notNull()` derives as **nullable** (e.g. `subscription.status`). That's correct; handle the null.
- **A delete is an archive.** Once points have moved, the row stays, because the ledger references it. A campaign, a listing, and a device all archive.
- **A refund posts a `refund` entry.** It never deletes a row and never edits one.
- **Bought points never expire.** The expiry job must skip the `bought` lot. Expiring points somebody paid for is a consumer-law problem.
- `pnpm db:generate` and `pnpm db:push` open an interactive prompt whenever a diff could be a rename, and they crash without a TTY. Split the change into a drop-only migration and a create-only one so neither diff is ambiguous — `0004`/`0005` are that pair.
- `pnpm verify` is the single gate definition — CI (`.github/workflows/ci.yml`), `.githooks/pre-push`, and the Claude Code hook all call it, so they cannot drift apart. Change the gate there, not in three places. `typecheck` is what enforces `expectTypeOf` assertions — vitest does not.
- The gate must keep passing with **no `.env` present** — that is what CI and a fresh clone get. If a task starts needing a database, add a postgres service to the CI workflow rather than weakening the gate.
- `.githooks/` installs via the root `prepare` script (`git config core.hooksPath`). A fresh `pnpm install` wires it up; no husky or lefthook dep. Emergency bypass: `git push --no-verify`.
- `/serve`, `/loop`, `/report`, `/scan/*` accept any origin, because CapyTV runs on member devices and a scan comes from a stranger's phone; every other route keeps the `APP_URL`/`WEB_URL` allow-list. The check lives in the `cors()` origin function in `apps/api/src/lib/app.ts`. A new public screen route must be added there too.
- `/beacon` reads a **text/plain** body (`navigator.sendBeacon` cannot send JSON content types) and parses it by hand — do not add `zValidator("json")` there.
- Rate limiting and the visitor session salt are in-process memory. Fine for one API instance; move both to Redis before scaling out.
- `pnpm` only — never `npm install` or `yarn`
- Server env is validated through `@repo/env`; `apps/app` and `apps/web` validate public variables in their respective `apps/app/src/lib/env.ts` and `apps/web/src/lib/env.ts`
- Turbo caches aggressively — run `pnpm turbo <task> --force` if output is stale
- `@repo/*` is a permanent internal scope, not part of product branding
- shadcn primitives in `packages/ui/src/primitives` — add via `pnpm dlx shadcn@latest add <component>` from `packages/ui`; export from `packages/ui/src/index.ts` after adding
- UI components: use shadcn from `@repo/ui` — never raw HTML inputs, selects, buttons, or dialogs if shadcn equivalent exists or can be added

## Agent skills

### Issue tracker

Issues and PRDs are tracked as GitHub issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default five-label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

`CONTEXT.md` at the root is the glossary, and the only one. `docs/adr/` holds the decision records. Layout: `docs/agents/domain.md`.
