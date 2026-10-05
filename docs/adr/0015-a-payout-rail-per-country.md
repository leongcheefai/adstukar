---
status: proposed
---

# A payout leaves on the rail for the member's country, and the review stays

Stripe lets the Malaysia platform pay Malaysian accounts only (docs/adr/0011),
and the market is ten countries. A payout now leaves on one of three rails,
chosen by the country of the member's payout method: Stripe Connect for
Malaysia, as built; Airwallex for Thailand, Singapore, the United States,
Japan, Korea, Indonesia, Vietnam and the Philippines; and a bank transfer an
admin sends by hand for Brunei. The request, the review, the approval, the
ledger and the refusal do not change (docs/adr/0005, docs/adr/0008). Only the
last step, the send, has more than one door.

The rail is not the law. A payout is a payment for a service the screen
rendered, not a remittance and not stored value, so a Malaysian business may
pay a non-resident for it in foreign currency under the Bank Negara foreign
exchange notices. This ADR picks the provider that carries it, and nothing
else. The evidence is in `docs/research/2026-09-29-payout-rails.md`.

## Why these three

- **Stripe Connect stays for Malaysia.** It is built, it is live, and Stripe
  does the identity check better than we do. Nothing about it moves.
- **Airwallex for the other eight.** It is the only provider a Malaysian
  business can open by itself that pays all eight on local rails, in local
  currency, with a self-serve Payouts API and a public sandbox. A local
  transfer costs nothing, the FX margin is 0.40% to 0.60%, and there is no
  monthly fee. A USD 20 payout to Thailand loses about twelve cents. Airwallex
  (Malaysia) Sdn Bhd holds a Bank Negara remittance licence, so the money
  leaves a licensed door.
- **A bank transfer by hand for Brunei.** No provider pays Brunei cheaply in
  local currency. Airwallex reaches it by SWIFT only and does not carry BND;
  PayPal and Payoneer do not list it. The admin approves as always, sends the
  transfer from the Praxor bank, and pastes the bank reference into the row.
  ADR 0008 replaced this exact step for Malaysia; it comes back for one
  country, above a higher minimum, so the SWIFT fee stays a small share.

## What a rail is

A rail is the way an approved payout leaves. It is a property of the member's
payout method, never a choice the member makes at request time, and never a
choice the admin makes at approval. The country decides, and the map from
country to rail is one table in `economy.payout`. A country outside the map
cannot save a payout method, so it cannot request.

| Rail | Countries | Payout method on file | Who sends | Minimum |
|---|---|---|---|---|
| `stripe_connect` | MY | the connected Stripe account, as today | the API, a Transfer keyed on the request id | `economy.payout.minimum` |
| `airwallex` | TH, SG, US, JP, KR, ID, VN, PH | a beneficiary Airwallex validated: name, bank, account | the API, a Transfer keyed on the request id | `economy.payout.minimum` |
| `manual_transfer` | BN | bank details the member typed | the admin, from the Praxor bank | a higher minimum, proposed USD 100 |

## How the money moves on the Airwallex rail

- The Praxor Airwallex account holds a USD wallet. Stripe settles MYR, so an
  admin converts MYR to USD inside Airwallex now and then, in bulk. That
  conversion is the platform's, at the platform's time, and is not tied to a
  payout.
- Approval creates an Airwallex transfer with `source_amount` equal to the
  request's dollars, `source_currency` USD, and `payment_currency` the local
  currency of the beneficiary, with the request id as the `request_id`, inside
  the transaction that marks the row paid. Airwallex converts once, at its
  rate, and the recipient receives local currency on a local rail. The dollars
  the member read are the dollars that left, so the ledger keeps its meaning.
- The row stamps `paid_cents`, `paid_currency`, `fx_rate` and `fx_rate_date`
  from the transfer, the same four columns ADR 0012 added. The member's payout
  table reads `฿ 705.20 sent at 35.26 per USD` in the same shape as the
  ringgit line.
- The Bank Negara step of ADR 0012 belongs to the Stripe rail only. Airwallex
  quotes its own rate; there is nothing to fetch and no bounds to check. The
  rate bounds stay on the Stripe rail.
- The retry rule of ADR 0008 holds: a fresh idempotency key on every attempt,
  and both Pay and Refuse look up the transfer by `request_id` before they
  act. Neither path pays twice.
- The fee is the platform's. No fee comes off the rate (docs/adr/0010), and
  a rail fee is not a reason to start. The minimum bounds the share the fee
  takes.

## How the money moves on the manual rail

- Approval marks the row `approved`, not `paid`, and shows the admin the
  bank details and the amount. The admin sends the transfer, then presses
  Paid and pastes the bank reference into `reference`. The row stamps
  `paid_currency`, `paid_cents`, `fx_rate` and `fx_rate_date` from what the
  admin types, because the bank's rate is on the bank's receipt and nowhere
  else.
- A row that sits `approved` is a debt the platform owes, and the admin
  payout page lists it first until it is paid.
- Refuse works as on any rail, before Paid. After Paid, the money left.

## What we hold

Stripe holds the Malaysian member's identity and bank. Airwallex holds a
beneficiary id and validates the bank details; we hold the beneficiary id, the
country, and the currency. For the manual rail we hold the bank details the
member typed, in the payout method row, because there is nowhere else to put
them; it is the one place bank details live in our database, and the row is
readable by the member and an admin only.

The one row per member becomes a payout method: `rail`, `country`, and the
rail's own reference (`stripe_account_id`, or `airwallex_beneficiary_id`, or
the typed bank fields). `payouts_enabled` gates the Stripe rail as today; a
validated beneficiary gates the Airwallex rail; typed details gate the manual
rail.

## Considered

- **A US or UK company with Stripe Global Payouts.** The plan on 2026-09-22.
  Rejected: it reaches the same nine countries as Airwallex, never Korea, and
  costs a second company, a yearly filing, and the 1099 duty for every US
  screen that earns over USD 600. A Malaysian payer has no such duty.
- **Payoneer Mass Payouts.** The AdSense shape. Rejected: the price is not
  published and the product is sold through a sales team; at published retail
  rates a USD 20 payout loses a quarter, and a recipient who receives under
  USD 6,000 a year pays USD 29.95 a year. Every distributor would.
- **Trolley, Tipalti.** One integration, many rails. Rejected: the sender
  must be in the US, Canada, the EEA, the UK, Australia or New Zealand.
- **Wise Business.** Cheapest FX. Rejected: Wise has no business account in
  Malaysia.
- **PayPal Payouts.** Self-serve from Malaysia at 2%. Kept as the fallback if
  Airwallex refuses the account. It does not reach Thailand, Korea or Brunei,
  and the recipient converts at PayPal's spread.
- **A stablecoin.** Rejected: the member wants local currency in a bank, and
  the rule is grey in several of the ten countries.
- **Let the fee come off the payout.** Rejected: the rate is what the member
  keeps (docs/adr/0010), and a twelve-cent fee is not worth a second number on
  the page. The manual rail's SWIFT fee is bounded by its minimum instead.

## Consequences

- The open risk is the entity. Airwallex's help centre asks for an
  incorporated company, and Praxor is a sole proprietorship. One application
  answers it. If Airwallex refuses, the fallbacks are PayPal for seven
  countries, or a Sdn Bhd, which may be wanted before real money moves anyway.
  This ADR stays `proposed` until the Airwallex account is open.
- Japan needs a pre-registration with Airwallex before local JPY payouts
  work. It is a launch step, not code.
- A Brunei screen waits longer between payouts. At the cap a screen earns
  about USD 30 a month, so a USD 100 minimum is a payout a quarter. The
  minimum is a lever in `economy.ts`.
- Three rails is three places a send can fail. Each rail is one adapter
  behind one `pay` call, and the job that lists what is owed does not care
  which.
- The Terms say "Stripe Connect, Malaysia only, paid in MYR". They must say
  the rail for the member's country and the currency it pays, before a
  non-Malaysian screen is approved.
- If Stripe one day lets a Malaysia platform transfer abroad, Airwallex
  becomes one rail among two, and nothing in this ADR has to be undone.
