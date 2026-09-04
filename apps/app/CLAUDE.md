# apps/app

## Purpose
Vite + React 19 SPA. The publisher dashboard — signup, login, Overview, Products, Placements, Ledger, Settings, and the admin Moderation queue. Runs on port 3000 and calls the API origin configured by `VITE_API_URL`. `VITE_EMBED_URL` is the script URL shown in placement snippets (defaults to the API's `/embed/adstukar.js`).

## Pages
- `routes/dashboard/index.tsx` Overview — balance (settled + pending with tooltip), today's shown/received/clicks/CTR, 30-day chart
- `routes/dashboard/products.tsx` — list, create/edit/duplicate dialog with live `AdCard` preview, verify dialog, campaign toggle (`advertise`)
- `routes/dashboard/placements.tsx` — snippet (HTML + React) with copy buttons, API key + rotate, size, house-ad slider, excluded terms
- `routes/dashboard/ledger.tsx` — filterable, cursor-paginated table
- `routes/dashboard/settings.tsx` — two-panel layout; sections live in `src/components/settings/`. Admin-only Moderation and Releases sections appear there for `role === 'admin'`; `/dashboard/admin/*` redirects in
- Query hooks live in `src/lib/{products,placements,stats,ledger,admin}.ts` on top of `src/lib/api.ts` (`apiFetch`)

## Conventions
- All env access through `src/lib/env.ts` (validated via `@t3-oss/env-core`) — never `import.meta.env.VITE_*` directly
- Authenticated API calls must include `credentials: 'include'` — session auth is cookie-based
- Auth state via `useSession()` from `src/lib/auth.ts` — never manage session state manually
- Dashboard pages must be nested inside the `/dashboard` route in `router.tsx` so `ProtectedRoute` + `DashboardLayout` wrap them automatically

## Common tasks

### Add a new dashboard page
1. Create `src/routes/dashboard/<name>.tsx`
2. Add a `<Route>` inside the `/dashboard` parent in `router.tsx`
3. Add a title to `PAGE_TITLES` and a nav item to `navItems()` in `src/routes/dashboard/layout.tsx`

### Add a new API call
Use `useQuery` or `useMutation` from TanStack Query. Fetch against `${env.VITE_API_URL}/<endpoint>` and include `credentials: 'include'` when the endpoint depends on the user session.

### Enable Google sign-in
Add a button calling `signIn.social({ provider: 'google', callbackURL: '/dashboard' })`. No other config needed here — Google OAuth activates in `packages/auth` when the env vars are set.

### Browse the component library
Navigate to `http://localhost:3000/_dev/components` in dev mode. This route is tree-shaken from production builds.

### Work on the UI with no API or database
Open `http://localhost:3000/dashboard?design=1`. Design mode fakes an admin session and answers every read endpoint from fixtures, so every page renders populated. Leave it with `?design=0`, or click the "design mode" badge in the top-right nav.

- `src/lib/design-mode.ts` holds the flag, the fake session, and all fixtures
- `useSession()` in `src/lib/auth.ts` returns the fake session, so `ProtectedRoute` passes and the admin settings sections appear
- `apiFetch` in `src/lib/api.ts` and `fetchReleases` in `src/lib/releases.ts` return fixtures instead of calling the API
- Writes are faked too, so every control responds. `designWrite()` replaces the matching fixture in memory; a reload restores the starting data. Each update builds a new object, because React Query would treat an edit in place as no change and skip the repaint
- Settings writes (profile, password, sessions) go through the better-auth client, not `apiFetch`, so they still need the API
- Every check is gated on `import.meta.env.DEV`, so production builds report false and the bundler drops the fixtures. Verify with `NODE_ENV=production pnpm --filter @repo/app build`, because the repo-root `.env` sets `NODE_ENV=development` and a plain `pnpm build` therefore emits a development bundle that keeps them. Keep each fixture inside a function or a plain literal: a top-level expression that spreads another fixture is treated as side-effecting and pins that data into production
- Add a read by adding a case to `designResponse()`; add a write by adding a branch to `designWrite()`. An unknown path throws instead of failing quietly

## Gotchas
- Dev server: port 3000; the API defaults to `http://localhost:3001`. A Vite `/api/*` proxy exists for relative requests, but the current clients use the absolute `VITE_API_URL`.
- Icons come from `@phosphor-icons/react`, not lucide. Phosphor takes `weight` (`bold`, `fill`, …) instead of `strokeWidth`
- The `/_dev/components` route only exists in dev; it is absent from production builds
- Design mode data is fake. The badge in the top-right nav is the only signal, so check it before trusting a number on screen
- Design mode leaves `verificationToken` and `apiKey` empty on purpose, so no fixture value can look like a leaked secret. The verify panel and the placement snippet show a blank key. Start the API to see a real one
