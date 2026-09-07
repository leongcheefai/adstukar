# packages/db

## Purpose
Drizzle ORM schema, the Postgres client singleton, and migration tooling. Every other package or app that needs database access imports `db` and `schema` from here.

## Conventions
- `drizzle.config.ts` reads `process.env.DATABASE_URL` directly (Drizzle Kit CLI runs outside the app context and cannot use `serverEnv`) — all application code uses `serverEnv` from `@repo/env`
- `auth.ts` schema table shapes must stay in sync with Better Auth's adapter — do not rename columns without checking Better Auth's adapter requirements
- No build step — exports point to TypeScript source directly
- `exchange.ts` holds the CapyAds tables (`campaign`, `listing`, `device`, `placement`, `excluded_term`, `play`, `ledger_entry`); enum tuples for them live in `enums.ts`
- `ledger_entry` is append-only: only `state` (pending → settled → void) and `settled_at` ever change, and only through `apps/api/src/modules/ledger/ledger.service.ts`. Every row carries a `lot` (`bought` / `earned` / `granted`), and the lot decides what the point may do
- `play.placement_id` is `ON DELETE restrict`, not cascade: a play is where points came from, so dropping a placement must never take the record of its plays with it

## Common tasks

### Add a new table
1. Create `src/schema/<name>.ts` with a Drizzle table definition
2. Export from `src/schema/index.ts`
3. Run `pnpm db:generate` then `pnpm db:migrate`

### Modify an existing table
1. Edit the table definition in `src/schema/<name>.ts`
2. Run `pnpm db:generate` (creates a migration file) then `pnpm db:migrate`

### Push schema without migrations (dev only)
```bash
pnpm db:push
```

### Browse data
```bash
pnpm db:studio
```

## Gotchas
- `auth.ts` tables must match the shape Better Auth expects exactly — check Better Auth docs before adding or renaming columns
- `billing.ts` imports `user` from `./auth` for the FK reference — import order matters for Drizzle relation resolution
- `drizzle-kit generate` and `drizzle-kit push` open an interactive prompt whenever a diff could be a rename (a dropped enum plus a created one), and they crash with "Interactive prompts require a TTY terminal" in a non-TTY shell. Split the change into a drop-only migration and a create-only one so neither diff is ambiguous — `0004_drop_barter_model` and `0005_screens_network_model` are that pair
- `0005` is hand-edited: the generated `ADD COLUMN "lot" ... NOT NULL` fails on a table that already holds rows, so it adds the column with a `granted` default and drops the default again
- `InferSelectModel` and `InferInsertModel` are re-exported from `src/index.ts` so consumers do not need to depend on `drizzle-orm` directly for type inference
