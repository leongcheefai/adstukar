Add a new Stripe product and wire it into the billing flow.

Ask the user for the product name, price, and recurring billing interval (monthly/yearly), then:

1. In the Stripe Dashboard (test mode), create a new Product with a Price. Copy the `price_...` ID.

2. Add the price IDs to the root `.env`:
   ```
   STRIPE_PRO_PRICE_ID_MONTHLY=price_...
   STRIPE_PRO_PRICE_ID_YEARLY=price_...
   ```
   Or add a new env var in `packages/env/src/index.ts` for additional plan tiers (e.g. `STRIPE_ENTERPRISE_PRICE_ID`).

3. The existing Pro plan IDs are returned by `GET /billing/config` and consumed by both dashboard and marketing pricing flows. For another tier, extend the env schema, billing contract/config response, pricing UI, and checkout selection together.

4. Webhook handling is price-agnostic and already covers checkout completion, subscription create/update/delete, paid invoices, and payment failures. A new recurring price does not need another webhook branch.

5. To test locally, forward webhooks with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/billing/webhook
   stripe trigger checkout.session.completed
   ```

6. When preparing production, run `pnpm launch:check -- --env <production-env-path>` to catch partial Stripe configuration. Run `pnpm verify` before finishing.
