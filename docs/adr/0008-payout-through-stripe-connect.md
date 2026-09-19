# A payout leaves through Stripe Connect, and the review stays

A distributor connects a Stripe account once. When they ask for a payout, an
admin reviews the history as before (docs/adr/0005), then approves, and the API
sends the money as a Stripe Transfer to that account. Nobody types a bank number
and nobody sends money by hand. The minimum payout is $10.

ADR 0005 planned this step for when the monthly batch stopped fitting in one
admin session. We took it earlier, because a typed bank number is a form nobody
wants to fill, and because Stripe does the identity check better than we do.

## What Stripe holds, and what we hold

Stripe holds the identity and the bank details. We hold one row per member:
the connected account id, the country, and two flags Stripe sets —
`details_submitted` and `payouts_enabled`. The second is the only thing that
gates a request. A row with `payouts_enabled` false blocks with
`stripe-pending`; no row blocks with `stripe`.

The account is a v1 connected account with `controller` properties: Stripe
collects the requirements, Stripe carries the losses, CapyAds pays the Stripe
fees, and the member gets the Express dashboard. Only the `transfers`
capability is requested, because the account receives and never charges.

We did not use the v2 Accounts API with the `recipient` configuration. It is
built for this case, but it is young, and its country coverage for a Malaysia
platform is not clear. A move to it later needs no schema change.

We did not embed the onboarding. Stripe's hosted page is enough at this size,
and Connect.js is a browser dependency for no gain.

## How the money moves

- The amount leaves the ledger at the request, as before. Nothing about the
  ledger changes.
- Approval creates a Transfer for the request's `usd_cents`, keyed on the
  request id, inside the transaction that marks the row paid. Stripe throws →
  the row stays `requested` and the admin tries again. The row update fails
  after the transfer → the row still says `requested`, so both Pay and Refuse
  look for a transfer in the request's `transfer_group` first. Pay records the
  one it finds; Refuse stops, because the money already left. The idempotency
  key covers the same day; the group lookup covers every day after it. Neither
  path pays twice.
- The transfer id goes in `stripe_transfer_id` and in `reference`, so the
  member's ledger page reads the same for a payout sent by hand and one sent by
  Stripe.
- Refusal does not change: the compensating row posts and the amount comes back.

## The webhook

Stripe signs events from connected accounts with a Connect endpoint's own
secret, so they arrive on `/billing/connect-webhook` under
`STRIPE_CONNECT_WEBHOOK_SECRET`, not on the top-up route. One event matters:
`account.updated`. The handler reads the account back from Stripe and stores
the two flags; it does not trust the payload, because Stripe may deliver an old
event after a newer one. The dashboard also reads the flags straight from
Stripe when the member returns from onboarding, so the panel is right before
the webhook lands.

## Consequences

- A connected account's country is fixed at creation, so the member chooses it
  before the account exists, from the list in `economy.payout.countries`. Which
  countries a Malaysia platform may pay cross-border is Stripe's list, and ours
  must match it.
- The row is frozen while a request is under review, as the old account form
  was: the account an admin approved is the account that is paid.
- A capability lost after a request opens makes the approval fail with 409. The
  admin refuses, or waits.
- An account outside the platform's country may need
  `tos_acceptance.service_agreement: "recipient"` at creation. Verify it with
  the country list before launch; `connect.ts` is the one place to add it.
- `connectStripe` holds the member lock across two Stripe calls. Only the
  create needs the transaction; the link could follow the commit. It is a
  one-member lock for a few hundred milliseconds, so it stays until it hurts.
- Not handled yet: `transfer.reversed`, a Stripe balance shortfall on the
  platform, and a capability lost after payment. Each is a follow-up.
