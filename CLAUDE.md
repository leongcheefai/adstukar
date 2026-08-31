# Praxor Kit

## Purpose
Production-ready SaaS boilerplate for indie hackers. Vite + Hono + Better Auth. pnpm + Turborepo monorepo: three apps (`web`, `app`, `api`), seven shared packages (`ui`, `db`, `auth`, `emails`, `env`, `config`, `contracts`).

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
- "Run everything locally" → `pnpm bootstrap && pnpm dev`
- "Set up a worktree" → from inside it, `pnpm worktree:init` (links the main checkout's `.env`, installs deps). Add `--db` to give it its own database instead of sharing
- "Try a branch a worktree is building" → from the main checkout, `pnpm review <branch>`; `pnpm review --back` returns. Detached checkout, so it works while the worktree holds the branch
- "Run typecheck" → `pnpm typecheck`
- "Check launch readiness" → copy `.env.example` to an ignored production env file, then run `pnpm launch:check -- --env <path>`; run `pnpm verify` separately for the code-quality gate
- "Before commit/push" → `pnpm verify` (lint + typecheck + test + build) must pass — enforced three ways: GitHub Actions on every PR, a native `.githooks/pre-push` hook, and a Claude Code hook

## Gotchas
- **zod dialect split**: `packages/contracts` uses `zod/v4` (`import * as z from "zod/v4"`) because drizzle-zod emits v4 instances. Rest of repo uses v3 (bare `zod`). Both ship inside zod 3.25.76. Bare `zod` in contracts = classes silently don't match. `ZodError` in `apps/api/src/middleware/error.ts` must come from `zod/v4` or the branch never fires. v4 has no `z.AnyZodObject`; `ZodType` is `<Output, Input, Internals>`.
- `toWire` **throws** on schema types outside its allowlist (`.default()`, unions, records, `.refine()`, tuples). Deliberate — silent passthrough would leak a raw `Date` while the type claims `string`. Don't weaken the schema to dodge it.
- A renamed/dropped column makes `.pick()` throw `Unrecognized key` **at module load, not compile time** — TS's excess-property check only fires when every mask key is invalid.
- `pgEnum` without `.notNull()` derives as **nullable** (e.g. `subscription.status`). That's correct; handle the null.
- `pnpm verify` is the single gate definition — CI (`.github/workflows/ci.yml`), `.githooks/pre-push`, and the Claude Code hook all call it, so they cannot drift apart. Change the gate there, not in three places. `typecheck` is what enforces `expectTypeOf` assertions — vitest does not.
- The gate must keep passing with **no `.env` present** — that is what CI and a fresh clone get. If a task starts needing a database, add a postgres service to the CI workflow rather than weakening the gate.
- `.githooks/` installs via the root `prepare` script (`git config core.hooksPath`). A fresh `pnpm install` wires it up; no husky or lefthook dep. Emergency bypass: `git push --no-verify`.
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

When domain docs are introduced, use the single-context layout in `docs/agents/domain.md`.
