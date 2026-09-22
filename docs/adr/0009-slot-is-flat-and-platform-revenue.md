# A slot is a flat price, and the money is platform revenue

> Status: amended by docs/adr/0010. The flat price stays. The venue screens now
> play the ring too, and the platform pays each screen a fixed rate from the
> slot money, so the per-play economy this record left untouched is retired.

An advertiser buys one slot on the CapyTV ticker for one term at one flat price
(`economy.slot`: 20 slots, $20, 7 days). The whole price goes to the platform.
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
- A slot does not pause. The member paid for a position for a term, and the
  term runs to its end on the clock. The API refuses a pause on the campaign
  and on the creative while the slot is booked or running, and the dashboard
  offers none. The exits are an edit, which sends the creative back to review
  and holds the band, and an archive, which ends the term. A pause made sense
  in the per-play economy, where it saved money; on a flat slot it saves
  nothing (KEV-31).
- The database refuses a double booking with a partial unique index on the
  position. Two bookings that race never both pass a check in code.

Revisit when the ring stays full for several weeks. The likely next steps are a
waiting list, and a second ring per region.
