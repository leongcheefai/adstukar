# apps/app

## Purpose
Vite + React 19 SPA. The publisher dashboard — signup, login, Overview, Products, Placements, Ledger, Settings, and the admin Moderation queue. Runs on port 3000 and calls the API origin configured by `VITE_API_URL`. `VITE_EMBED_URL` is the script URL shown in placement snippets (defaults to the API's `/embed/adstukar.js`).

## Pages
- `routes/dashboard/index.tsx` Overview — balance (settled + pending with tooltip), today's shown/received/clicks/CTR, 30-day chart
- `routes/dashboard/products.tsx` — list, create/edit dialog with live `AdCard` preview, verify dialog, advertise/show-ads toggles
- `routes/dashboard/placements.tsx` — snippet (HTML + React) with copy buttons, API key + rotate, size, house-ad slider, excluded terms
- `routes/dashboard/ledger.tsx` — filterable, cursor-paginated table
- `routes/dashboard/admin/moderation.tsx` — approve/reject with reason
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

## Gotchas
- Dev server: port 3000; the API defaults to `http://localhost:3001`. A Vite `/api/*` proxy exists for relative requests, but the current clients use the absolute `VITE_API_URL`.
- The `/_dev/components` route only exists in dev; it is absent from production builds
