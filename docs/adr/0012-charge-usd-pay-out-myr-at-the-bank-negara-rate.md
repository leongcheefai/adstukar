# CapyAds charges USD, and a payout leaves in MYR at the Bank Negara rate of the day

CapyAds is an international business, so the price an advertiser sees and
pays is in USD, and the ledger stays in USD (docs/adr/0007). The platform is a
Malaysia Stripe account and settles MYR only (docs/adr/0011), so a Transfer to
a distributor is in MYR. The dollars are converted once, on the day the admin
approves, at Bank Negara Malaysia's 12:00 middle rate.

## How the money moves

| Step | Currency | Who converts |
|---|---|---|
| An advertiser pays a top-up or a slot | USD, on the card | Stripe, to MYR at settlement, plus its 2% conversion fee |
| The ledger holds the amount | USD units, as before | nobody |
| An admin approves a payout | USD → MYR at the day's rate | CapyAds, in `payPayout` |
| Stripe transfers to the distributor | MYR | Stripe, no fee on a Transfer |
| Stripe pays the distributor's bank | MYR | Stripe, free on the standard schedule |

## The rate

- The source is Bank Negara Malaysia's open API (`api.bnm.gov.my`), the
  12:00 session, quoted in ringgit. It is official, free, and needs no key.
- One fetch per approval, no cache. A stale rate is a wrong price, and the
  admin can always try again in a minute.
- `economy.payout.paidIn.rateBounds` says what rate the ringgit could really
  have. A quote outside it refuses the approval with 409. That is the guard
  against a broken feed, a changed shape, or a decimal slip.
- When the feed does not answer, the approval fails with 503 and nothing is
  guessed. No fallback rate, no last-known rate.
- The pure rules are in `apps/api/src/modules/payouts/fx.ts`; the fetch is in
  `bnm.ts`.

## What the row keeps

`payout_request` gains `paid_cents`, `paid_currency`, `fx_rate`, `fx_rate_date`,
all null until paid. They are stamped from the Stripe Transfer, not from the
quote: the rate rides in the transfer's metadata, so a retry that finds a
transfer already made records the rate that really applied (docs/adr/0008
explains the retry). The member's payout table reads
`RM 40.76 sent at 4.0755 per USD`.

`GET /admin/payouts/:id/quote` shows the admin the ringgit figure before the
press. It is a preview; the transfer takes its own rate a moment later, and
the two can differ by the day's move if the dialog stays open past noon.

## What it costs

Stripe Malaysia pricing on 2026-09-22: a Malaysian card paying USD costs
3% + RM1 plus 2% conversion; a foreign card adds 1%. Charging MYR to the same
Malaysian card would cost 3% + RM1. USD costs about two points of every dollar
of revenue, plus Stripe's spread, before the platform earns anything.

The advertiser's dollars become ringgit on the day they pay. The distributor's
dollars become ringgit on the day the admin approves, 30 or more days later.
The gap is the platform's, in either direction. `GET /admin/pool` reads the
week's revenue against the week's earn in USD units; the ringgit gap is not
shown there yet.

## Considered

- **Charge MYR.** No conversion fee, no gap, no rate to fetch. Rejected,
  because the business is international and a Malaysia platform can pay
  Malaysian distributors only today; a USD price is the one thing that does
  not have to change when it can pay others.
- **A fixed peg in `economy.ts`.** One lever, no network. Rejected, because a
  peg the admin forgets to move pays members the wrong ringgit for months, and
  the difference is the platform's money.
- **Stripe's own rate.** It is what Stripe applies to the top-up. There is no
  public quote API for it on this account.

## Consequences

- An approval now needs Bank Negara to answer. It publishes on Malaysian
  business days. The code reads the latest endpoint, which should answer with
  the last session on a weekend or a holiday, and `fx_rate_date` then says
  which day the rate was for. Not yet verified on a weekend; the by-date
  endpoint returns 404 for a Sunday.
- A payout the member reads in dollars lands as ringgit at a rate they did not
  choose. The rate and the date sit on the row, so they can check it.
- If the platform ever moves to a country that settles USD, the fetch and the
  conversion go, and the four columns still read true for every row already
  paid.
