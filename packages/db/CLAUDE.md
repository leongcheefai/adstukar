# packages/db

## Purpose
Drizzle ORM schema, the Postgres client singleton, and migration tooling. Every other package or app that needs database access imports `db` and `schema` from here.

## Conventions
- `drizzle.config.ts` reads `process.env.DATABASE_URL` directly (Drizzle Kit CLI runs outside the app context and cannot use `serverEnv`) — all application code uses `serverEnv` from `@repo/env`
- `auth.ts` schema table shapes must stay in sync with Better Auth's adapter — do not rename columns without checking Better Auth's adapter requirements
- No build step — exports point to TypeScript source directly

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
- `InferSelectModel` and `InferInsertModel` are re-exported from `src/index.ts` so consumers do not need to depend on `drizzle-orm` directly for type inference
