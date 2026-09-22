# A payout leaves through Stripe Connect, and the review stays

> The account shape, the country list, and the USD settlement step below are
> superseded by docs/adr/0011: the platform is a Malaysia account, so the
> connected account is a Standard account, and only MY may be paid. The
> Transfer is in MYR at the day's Bank Negara rate (docs/adr/0012). The flow,
> the webhook, the row, and the ledger rules stand.

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
fees, and the member gets the Express dashboard. The account receives and
never charges, so it asks for the `transfers` capability. Stripe allows that
alone only in the platform's own country (`economy.payout.platformCountry`);
anywhere else the account must ask for `card_payments` too, and Stripe then
collects the merchant requirements as well. The recipient service agreement,
which would avoid that, is not offered to this platform. The same rule holds on
the v2 API, so it is Stripe's rule and not the API's.

We did not use the v2 Accounts API with the `recipient` configuration. It is
built for this case, but it is young, and its country coverage for a Malaysia
platform is not clear. A move to it later needs no schema change.

We did not embed the onboarding. Stripe's hosted page is enough at this size,
and Connect.js is a browser dependency for no gain.

## How the money moves

- The amount leaves the ledger at the request, as before. Nothing about the
  ledger changes.
- Approval creates a Transfer for the request's `usd_cents`, with the request
  id as its `transfer_group`, inside the transaction that marks the row paid.
  Stripe throws → the row stays `requested` and the admin tries again. The row
  update fails after the transfer → the row still says `requested`, so both Pay
  and Refuse look for a transfer in the group first. Pay records the one it
  finds; Refuse stops, because the money already left. Neither path pays twice.
- The idempotency key is fresh on every attempt, not the request id. Stripe
  keeps the first result under a key, a failure included, so a fixed key would
  hand back the first refusal for a day and no retry could pay. The key covers
  only the SDK's own retries of one attempt; the group lookup is the guard.
- The transfer id goes in `stripe_transfer_id` and in `reference`, so the
  member's ledger page reads the same for a payout sent by hand and one sent by
  Stripe.
- Refusal does not change: the compensating row posts and the amount comes back.
- A transfer is in USD, because the ledger is. Stripe takes it from the
  platform's USD balance and nothing else, so the platform must settle USD in
  USD: a USD bank account on the platform account, under Settings → Bank
  accounts and currencies. Without it every USD charge converts to the
  platform's home currency at settlement, and every transfer fails with
  `balance_insufficient`. This is a Stripe setting, not code, and it is a
  launch step.

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
  countries the platform may pay is Stripe's list, and ours must match it. The
  sandbox platform is in Singapore. Probed on 2026-09-19: SG, MY, TH, US, GB,
  AU, JP and HK accept an account; ID, PH, VN and IN refuse one. Stripe's hosted
  onboarding then refuses MY from a Singapore platform, and accepts every other
  one on the list. A Malaysia platform account, or embedded onboarding, is the
  way to pay a Malaysian distributor; that decision is open.
- The row commits before the Account Link is made, on purpose. A link can fail
  where the account did not, and a rollback then would leave an account on
  Stripe that no row names; the next press would make another.
- The row is frozen while a request is under review, as the old account form
  was: the account an admin approved is the account that is paid.
- A capability lost after a request opens makes the approval fail with 409. The
  admin refuses, or waits.
- `connectStripe` holds the member lock across two Stripe calls. Only the
  create needs the transaction; the link could follow the commit. It is a
  one-member lock for a few hundred milliseconds, so it stays until it hurts.
- Not handled yet: `transfer.reversed`, a Stripe balance shortfall on the
  platform, and a capability lost after payment. Each is a follow-up.
