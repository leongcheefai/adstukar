# A refund is an admin's act, not a member's button

An advertiser buys points with money, and the unspent part may go back as money
inside the refund window (docs/adr/0001). The member does not press that button.
They ask, and an admin gives the refund from Settings → Top-ups.

## Why

- A refund moves money out of Stripe. A self-serve button turns every bought
  point into a card-fee-shaped loan: buy, hold, refund, and the processor fee is
  ours. A person in the path makes that a conversation rather than a loop.
- A payout already works this way (docs/adr/0005). Money leaves only when an
  admin acts, and the same person now sees both doors.
- The volume is small. While one admin can read the whole month, the manual
  step costs less than the fraud rules a self-serve refund would need.

## What stays the same

The rules that decide what may go back are unchanged and pure
(`apps/api/src/modules/topups/packs.ts`): the window, the unspent balance, and
the fee floor. The admin sees the same block reasons the member's table used to
show. The ledger side is unchanged too: a refund posts a compensating `refund`
entry against the `bought` lot and never edits a row.

## What changed

- `POST /topups/:id/refund` is gone. `GET /admin/topups` lists every top-up that
  took money, with its owner, and `POST /admin/topups/:id/refund` runs the refund.
  Both sit behind the admin guard.
- The member's top-up table reports a refund that happened and offers none.
- The admin confirms once before the money goes, because the act is not undone.

Revisit when refund requests are more than a handful a week. The likely next step
is a request row the member opens and the admin approves, in the shape of a payout.
