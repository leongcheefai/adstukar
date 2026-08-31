# apps/api

## Purpose
Hono API server on Node.js. Handles auth (Better Auth), billing (Stripe), and all business logic. Runs on port 3001 in development.

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
- Webhook endpoint at `POST /billing/webhook` must receive the **raw body** for signature verification — do not add JSON body-parsing middleware to this route
- Stripe API version is pinned in `src/lib/stripe.ts` — update after checking Stripe changelog for breaking changes
- `subscription_data.metadata.userId` is set on checkout so webhooks can look up the user without a customer lookup
