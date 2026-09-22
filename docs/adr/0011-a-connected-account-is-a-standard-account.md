# The platform is in Malaysia, so a connected account is a Standard account

The CapyAds Stripe platform account is `CapyChannel`, a Malaysia account under
Praxor. Stripe does not let a Malaysia platform create a connected account
where the platform is liable for losses. Every shape ADR 0008 picked or
considered needs that liability, so the connected account is now a Standard
account: the member pays their own Stripe fees, Stripe carries the losses, the
member gets the full Stripe dashboard, and Stripe collects the requirements.

## What we probed

Against the `CapyChannel sandbox` (`acct_1UIKRxLCjIwW7VKa`, country MY) on
2026-09-22, with a `MY` connected account unless said otherwise:

| Shape | Result |
|---|---|
| Express (`losses: application`) | refused: a MY platform may not be loss-liable |
| Express with `losses: stripe` | refused: Express needs the platform liable |
| `dashboard: none`, `losses: stripe` | refused: needs `card_payments`, and `requirement_collection: application` needs the platform liable |
| v1 recipient service agreement | refused: not offered to a MY platform for a MY account |
| v2 recipient account, `losses_collector: stripe` | refused: a recipient account needs the application as loss collector |
| v2 recipient account, `losses_collector: application` | refused: a MY platform may not be loss-liable |
| Standard: `fees: account`, `losses: stripe`, `dashboard: full`, `card_payments` + `transfers` | accepted, and the hosted onboarding link is issued |

The Standard shape creates an account for MY, SG, TH, US, GB, AU, JP and HK,
and refuses ID, PH and VN. But `GET /v1/country_specs/MY` says
`supported_transfer_countries: ["MY"]`: a Malaysia platform may transfer to a
Malaysia account only. The other seven would onboard and then never be paid,
so the list is `["MY"]`. Every probe account was deleted.

## What changes

- `accountParams` in `apps/api/src/modules/payouts/connect.ts` asks for the
  Standard shape, and asks for `card_payments` beside `transfers` in every
  country, because the full dashboard refuses `transfers` alone. The account
  never charges a card.
- `economy.payout.platformCountry` is gone. The country made a difference only
  to which capabilities an Express account asked for.
- `economy.payout.countries` is `["MY"]`. The cash-out dialog shows a sentence
  instead of a select while the list has one entry.
- The dashboard panel no longer says CapyAds covers the Stripe fees, and no
  longer counts countries by hand.

## What does not change

- The flow: hosted onboarding, `payouts_enabled` gates a request, an admin
  approves, a Transfer keyed on the request id moves the money (ADR 0008).
- The webhook: `account.updated` on `/billing/connect-webhook`.
- The row: id, country, and the two flags.
- The ledger.

## Consequences

- The member opens a real Stripe account in their own name. Stripe asks them
  for what it asks any Malaysian business or individual: identity, address,
  bank details. That is a longer form than Express, and the member sees
  Stripe's full dashboard afterwards. We accept it, because it is the only door.
- The member pays whatever Stripe charges their account. A Transfer to a
  connected account carries no Stripe fee, and Stripe's standard payout to a
  bank in MY is free at the time of writing. We do not promise either in copy.
- **Open: the transfer currency.** A Transfer is in USD today, because the
  ledger is (ADR 0008). `country_specs/MY` lists `myr` as the only bank
  account currency, so this platform cannot hold a USD balance: every USD
  top-up settles to MYR, and a USD Transfer fails with `balance_insufficient`.
  The Transfer must move to MYR, converted at approval, with the rate and the
  MYR amount kept on the payout row. Which rate (Stripe's, a fixed peg, or a
  daily fix) is a business decision and a separate ADR. Until it lands, an
  approval fails on this account.
- Stripe may change the Malaysia rule. If a Malaysia platform can carry
  losses one day, Express is a one-function change back, and this ADR is
  superseded.
