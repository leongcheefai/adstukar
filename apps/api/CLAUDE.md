# apps/api

## Purpose
Hono API server on Node.js. Handles auth (Better Auth), the CapyAds exchange (campaigns, listings, devices, placements, serve/report/scan, ledger, stats, moderation, jobs), and the dormant Stripe billing module kept for a later paid tier. Runs on port 3001 in development.

## Exchange modules
| Module | Routes | Auth |
|---|---|---|
| `campaigns` | `GET/POST /campaigns`, `PATCH/DELETE /campaigns/:id`, `POST /campaigns/:id/verify` | owner |
| `listings` | `GET/POST /listings`, `PATCH/DELETE /listings/:id` | owner |
| `devices` | `GET/POST /devices`, `PATCH/DELETE /devices/:id`, `POST /devices/:id/rotate-key`, `PUT /devices/:id/excluded-terms`, `GET /devices/:id/eligible-listings`, `PUT /devices/:id/vetoes`, `PUT /devices/:id/promotion` | owner |
| `placements` | `GET/POST /placements`, `PATCH/DELETE /placements/:id` | owner |
| `serve` | `GET /serve?key=`, `GET /loop?key=&size=`, `POST /report` (text/plain JSON), `GET /scan/:playId` | public, rate-limited |
| `stats` | `GET /stats/overview` | member |
| `ledger` | `GET /ledger?reason&state&lot&cursor&limit` | member |
| `payouts` | `GET /payouts`, `PUT /payouts/account`, `POST /payouts` | member |
| `admin` | `GET /admin/moderation`, `POST /admin/listings/:id/approve\|reject`, `POST /admin/devices/:id/approve\|reject`, `GET /admin/payouts`, `POST /admin/payouts/:id/pay\|reject` | admin |
| `jobs` | `startJobs()` from `index.ts`; `pnpm jobs:run` one-shot. Settlement, expiry, stale plays, and campaign pacing | — |
| `uploads` | `POST /uploads/logo/presign`, `POST /uploads/device-photo/presign` (S3, optional) | member |

A `DELETE` on a campaign, a listing, or a device is an **archive**: the row stays,
because the ledger reaches it through the plays it earned. Only a placement that
has never played is really deleted.

`GET /loop` cuts a whole batch of plays for a screen with a shaky network. Nothing
is charged when the batch is cut: the daily cap and the campaign budget are read
again at report time, so a batch is an offer of plays and never a promise that
every one of them pays. Each play carries its own `expires_at` — minutes from a
live `/serve`, hours from a `/loop` — and `POST /report` accepts a `playedAt` it
clamps to the life of the play, so a queued report counts against the day it ran
and a device cannot move its own history.

Approving a device stamps its tier and, the first time, mints the api key CapyTV
runs on. Registration writes a placeholder into the unique NOT NULL column and
the dashboard shows nothing until approval.

Only a moved screen goes back for review: `updateDevice` re-pends on a new
location or venue type, because the tier is priced on the room. A new name, a new
photo, or new open hours does not — the stated hours are what the payout review
measures the screen against, not what prices it. `device.approved_at` records the **first** approval and
survives a re-review, which is what stops a second approval from minting a new
key and blacking out a screen somebody has already paired. A rejection clears it,
so approving a refused screen later does issue a fresh key.

The daily play cap and the state of the campaign and the listing are read when
the points move, never when the play was served. Above the cap, or on a listing
an admin rejected after the batch was cut, the play still counts and simply pays
nothing — "plays above the cap still show, and pay nothing" (issue #7).

A scan can reach the API while the screen is still offline, because the viewer's
phone has its own network. `recordScan` then marks the play scanned and pays
nothing; `recordReport` settles the bonus when the screen reports the play.

A campaign paces itself. The listings under it split the daily budget evenly. The
campaign stops when the budget is spent, or when the owner's points run out. The
pacing job starts it again when the reason has gone. See
`src/modules/campaigns/pacing.ts` for the rules and `pacing.service.ts` for the
writes.

A payout takes earned points that have served the hold, and nothing else. The
request debits the account at once, so no balance can answer two requests; a
refusal posts the compensating row and the points come back. Payment is manual
and an admin reviews the history first — the scan-to-play ratio, the plays that
fell outside the venue's stated open hours, and devices sharing an address or a
network. See
`docs/adr/0005`, `src/modules/payouts/eligibility.ts` for the rules and
`review.ts` for the signals.

`POST /report` also stamps `device.last_seen_at` and `device.last_network`
whenever the key matches, whatever becomes of the play. The payout review reads
both, so a screen that stopped reporting is visible before cash leaves.

`GET /embed/*` serves `apps/embed/dist` when that directory exists (dev convenience).

## Conventions
- Every feature lives in `src/modules/<name>/`. A route file is required; add a service file when business logic warrants it. Shared request and response schemas belong in `packages/contracts`, not in API-local schema files.
- Routes export a Hono router; mount it in `src/lib/app.ts` — never add routes directly to `app.ts`
- Use `@hono/zod-validator` for request validation — never trust raw `c.req.json()` on mutating endpoints
- Parse responses with the matching `@repo/contracts` output schema before returning JSON
- Auth check: `const user = c.get('user'); if (!user) throw new HTTPException(401, ...)`
- All env access via `@repo/env` (the `serverEnv` export) — never `process.env`

## Common tasks

### Add a new API route
1. Add request and response contracts under `packages/contracts/src/inputs/` and `packages/contracts/src/modules/`, then export them from `packages/contracts/src/index.ts` and type-only exports from `types.ts` when a frontend consumes them.
2. Create or extend `src/modules/<feature>/`.
3. Put business logic in `<feature>.service.ts` when it should remain independent of Hono.
4. Export a Hono router from `<feature>.routes.ts`; validate input with `zValidator` and parse output with the shared contract.
5. Mount it in `src/lib/app.ts`: `app.route('/<feature>', featureRouter)`.

### Test an endpoint manually
```bash
# Health check
curl http://localhost:3001/health

# Authenticated endpoint (requires session cookie)
curl http://localhost:3001/me -H "Cookie: <session-cookie>"
```

## Stripe + Billing

### Local webhook testing with Stripe CLI
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/billing/webhook

# The CLI prints a webhook signing secret — add to .env as STRIPE_WEBHOOK_SECRET
```

### Webhook events handled
| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert subscription row with active status |
| `customer.subscription.created` | Upsert subscription row (handles non-checkout signups) |
| `customer.subscription.updated` | Update plan/status/period-end/cancel_at_period_end |
| `customer.subscription.deleted` | Mark subscription canceled |
| `invoice.paid` | Re-sync subscription status on successful payment |
| `invoice.payment_failed` | Mark subscription past_due, send payment-failed email |

Note: all webhook events are deduplicated via the `webhook_event` table (Stripe event ID as PK).

### Trigger test events
```bash
# Simulate a completed checkout
stripe trigger checkout.session.completed

# Simulate payment failure
stripe trigger invoice.payment_failed
```

### Adding a new Stripe product
1. Create product + price in Stripe Dashboard (test mode)
2. Put the monthly/yearly `price_...` IDs in the root `.env` as `STRIPE_PRO_PRICE_ID_MONTHLY` and `STRIPE_PRO_PRICE_ID_YEARLY`
3. `GET /billing/config` exposes those IDs to the dashboard and marketing pricing flows; checkout submits the selected ID to `POST /billing/checkout`

## Gotchas
- `POST /report` reads a **text/plain** body (`navigator.sendBeacon` cannot send JSON content types) and parses it by hand — do not add `zValidator("json")` there
- `/serve`, `/loop`, `/report` and `/scan/*` accept any origin, because CapyTV runs on member devices. Every other route keeps the `APP_URL`/`WEB_URL` allow-list; the check lives in `PUBLIC_PREFIXES` and the `cors()` origin function in `src/lib/app.ts`. A new public screen route must be added there too
- Webhook endpoint at `POST /billing/webhook` must receive the **raw body** for signature verification — do not add JSON body-parsing middleware to this route
- Stripe API version is pinned in `src/lib/stripe.ts` — update after checking Stripe changelog for breaking changes
- `subscription_data.metadata.userId` is set on checkout so webhooks can look up the user without a customer lookup
