# apps/app

## Purpose
Vite + React 19 SPA. CapyTV is the member app: boot mark, then a session check, then the two channel tiles or the login form on the same set. Dashboard (Overview, Campaigns, CapyPoints, Settings, admin Moderation) opens as a Vaul drawer over CapyTV at `/dashboard`. Runs on port 3000 and calls the API origin configured by `VITE_API_URL`. `VITE_EMBED_URL` still points at the unmaintained web embed bundle the API serves; no dashboard page reads it.

## Pages
- `routes/capychannel/home.tsx` CapyTV — `/` is the product. Every launch plays the boot mark first. Then a session sees the channel tiles (Images/Video, Wallpaper). No session goes to the landing site (`VITE_WEB_URL`), unless the URL carries `?auth=`, which shows the login form on the set. `/login`, `/signup` and `/forgot-password` redirect here with that parameter. The landing page does the reverse check and sends a session to the app. Account menu opens the dashboard as a Vaul drawer over CapyTV, or logs out.
- `routes/dashboard/index.tsx` Overview — the balance card (total earning, available, cash out, with the notes behind info tooltips and the payout setup button), the running ads card, the payout history chart, and recent wallet activity
- `routes/dashboard/campaigns.tsx` — the slot page. The ticker loop holds `economy.slot.count` slots at one flat price for one term. The page shows the offer (price, term, slots left), the slot grid, and the member's slots under a state menu. Booking and editing are a page, not a dialog: `routes/dashboard/slot-book.tsx` serves `/dashboard/campaigns/book?slot=<position>` and `/dashboard/campaigns/:campaignId/edit`, and `components/campaigns/slot-form.tsx` holds the form with a true-size preview. Pure rules live in `src/lib/slots.ts`. The API has no slot model yet, so a booking is one campaign with one listing, the term starts at `campaign.createdAt`, the taken count reads `TICKER_ADS`, and nothing charges the price. `SlotTicker` draws the loop flat with a label on each position (`#1` to `#20`); a press on an open band picks that position. The pick lives in `localStorage` (`adstukar:slot-positions`), and `loopOf` in `src/lib/slots.ts` places each brand. The CapyChannel ticker does not read the pick yet.
- `routes/dashboard/wallet.tsx` Wallet (`/dashboard/ledger` redirects to `/dashboard/wallet`) — filterable by reason, state and lot; cursor-paginated. The panel above it carries the cash-out dialog (identity on file, then the request), and the table under it lists every payout this member asked for
- `routes/dashboard/settings.tsx` — two-panel layout; sections live in `src/components/settings/`. Admin-only Moderation, Payouts, Top-ups (the refund desk) and Releases sections appear there for `role === 'admin'`; `/dashboard/admin/*` redirects in
- `/dashboard/products` redirects to Campaigns, `/dashboard/devices` redirects to Overview, and `/dashboard/placements` redirects to `/`, so links people saved before still work
- Query hooks live in `src/lib/{campaigns,stats,ledger,admin,payouts}.ts` on top of `src/lib/api.ts` (`apiFetch`). `campaigns.ts` owns listings too, because a listing only ever appears inside its campaign

## No device UI
The dashboard has no device UI. A member does not register a screen, and Moderation reviews listings only. The API still has the device routes. The admin payout review still shows the screen signals that the API sends.

## Conventions
- All env access through `src/lib/env.ts` (validated via `@t3-oss/env-core`) — never `import.meta.env.VITE_*` directly
- Authenticated API calls must include `credentials: 'include'` — session auth is cookie-based
- Auth state via `useSession()` from `src/lib/auth.ts` — never manage session state manually
- Dashboard pages must be nested inside the `/dashboard` route in `router.tsx` so `MemberLayout` (CapyTV) and `DashboardLayout` (Vaul drawer) wrap them. The drawer only mounts when a session exists.

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
- Icons come from `@phosphor-icons/react`, not lucide. Phosphor takes `weight` (`bold`, `fill`, …) instead of `strokeWidth`
- The `/_dev/components` route only exists in dev; it is absent from production builds
