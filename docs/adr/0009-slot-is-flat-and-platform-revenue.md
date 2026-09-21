# A slot is a flat price, and the money is platform revenue

An advertiser buys one slot on the CapyTV ticker for one term at one flat price
(`economy.slot`: 20 slots, $20, 7 days). The whole price goes to CapyChannel.
The ticker moves no per-play money.

## Why

- The CapyTV surface is the member's own set at `/`. There is no screen owner
  to pay per play, and a per-play earn on a screen every member can open would
  be a cash faucet with no attestation (docs/adr/0003).
- A flat price is a number a small business reads once. A per-play rate by
  tier and format is not.
- The old per-play economy (docs/adr/0002) stays in the code for the venue
  screens under `apps/capytv`. It is untouched, and the two never charge one
  campaign twice: a slot charge carries no `playId`, so the daily budget
  never sees it.

## What the rules are

- The charge lands at booking, as a `spend` keyed `slot:<id>`, so the
  position is held at once. `postSpend` takes `granted` first, then `bought`.
- The term starts when the campaign is verified and one creative is approved
  (`apps/api/src/modules/slots/term.ts`). Review time does not eat the term.
- A refusal, or an archive, before the term starts voids the charge and the
  amount comes back. A running slot keeps its charge.
- A term ends by a job and does not renew. The member books again by hand.
  No automatic charge means no surprise spend.
- The database refuses a double booking with a partial unique index on the
  position. Two bookings that race never both pass a check in code.

Revisit when the loop sells out for weeks in a row. The likely next steps are a
waiting list, and a second loop per region.
