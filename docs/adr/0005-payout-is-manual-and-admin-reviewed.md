# A payout is manual, and an admin reviews the history before the money leaves

A distributor turns earned points into money. We pay by hand for the MVP: a
distributor asks, an admin reads the history behind the request, sends the money
through a bank transfer or PayPal, and types the reference back in. Move to
Stripe Connect when the monthly payout volume passes about $2,000, because that
is the point where the batch stops fitting in one admin session.

CapyTV is a PWA, so there is no device attestation (docs/adr/0003). Approval, the
daily play cap, the payout hold and this review are the whole defence. A manual
payout keeps a person in the path while the estate is small enough for a person
to read.

## What the review shows

Three signals, one screen at a time, over the 30 days behind the request:

- **The scan-to-play ratio.** An ambient screen scans at 0.1-1%
  (docs/adr/0002). Thousands of plays and no scans is a screen that faces
  nobody.
- **Plays outside the venue's stated open hours.** The distributor states when
  the room is open, in whole hours and in its own time. The review counts what
  played while it was shut, and draws the whole day as a strip so the shape is
  visible even when a venue states no hours. A screen that plays around the
  clock does not sit in a cafe.
- **Devices that share an address or a network.** `device.last_network` holds a
  prefix (`203.0.113.0/24`), never an address, so the question "are these the
  same room?" can be answered without keeping data that identifies a household.

Every signal is a flag for a person to weigh. None of them refuses a payout.

## Consequences

- The points leave the account when the request is made, as a `payout` entry on
  the `earned` lot. A balance left in place would answer a second request, and
  would expire while an admin reviewed it.
- A refusal posts the compensating row and the points come back. It never edits
  the debit: the ledger is append-only, and a member who was refused must be
  able to read why the points returned.
- The compensating row does not serve a second hold. It gives back points that
  already served one, and a member must not be punished for a refusal that was
  not theirs.
- `payout_request` carries a partial unique index on the open state, so two taps
  on the button cannot open two requests.
- `usd_cents` is stored on the request rather than derived, so a change to the
  peg never rewrites what we already paid.
- Identity goes on file the day a member cashes out, not at signup. Nothing about
  earning waits for it. The account is frozen while a request is under review, so
  the destination an admin read cannot change before they send the money.
- A payout takes what the balance is worth in whole cents, not the balance. The
  part of a cent the money cannot carry stays as points and rolls over, because
  paying the rounded-down money against the whole balance would destroy the
  difference.
- Open hours are stated in whole hours and in the venue's own zone, and the zone
  comes off the browser rather than a form. Anything finer would be a form to
  fill in for a signal that only separates a shut room from an open one, and a
  member should not have to type a timezone to be paid.
- The stated hours never send a device back for review. The tier is priced on the
  room; the hours are only what the review measures the screen against.
- Stripe Connect replaces the payment step and the account form. It replaces
  neither the review nor the ledger, so both stay where they are.
