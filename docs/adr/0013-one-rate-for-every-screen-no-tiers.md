# One rate for every screen, and no tiers

A screen earns $2.00 per 1,000 plays (`economy.earn.perThousandPlays`, 2 units
a play), and every approved screen earns the same. The tier an admin stamped
at approval (docs/adr/0010) is gone: the `device.tier` column, the
`device_tier` enum, the multipliers, and the third pool lever.

## What changes

| Before (docs/adr/0010) | After |
|---|---|
| Standard $2.00, premium $3.00, flagship $4.00 per 1,000 plays | $2.00 per 1,000 plays |
| `POST /admin/devices/:id/approve` takes `{ tier }` | it takes no body |
| `earnPerPlay(tier)` and `rateTable()` | `earnPerPlay()` |
| Three pool levers: the slot price, approval, promotion | Two: the slot price, approval |

## Why

- A distributor reads one number, and it is the same number on the landing
  page, the help page, and the payout review. A tier gave three numbers and a
  judgement call between them.
- The admin's call at approval was the weakest part of the defence. A tier
  set the rate from a photo, and the photo is the one thing a screen owner
  controls. Approval now answers one question: is this a real screen in a real
  room.
- The pool (docs/adr/0010) is simpler to read. The earn grows with the screen
  count alone, so the lever an admin reaches for is the slot price or the
  pace of approval, and nothing else.

## What stays

Everything else in docs/adr/0010 holds: the platform pays the earn from slot
revenue, there is no fee row, a scan pays nothing, and a play above the cap or
outside the paid hours counts and pays nothing. A moved screen still goes back
for review, because approval was given to the room.

## Migration

`0018_drop_device_tier` drops the column and the enum. Every earn row already
posted keeps its delta; the ledger is append-only, so a premium screen's past
plays stay paid at the rate of their day.

Revisit if the pool needs a rate that follows the venue. The likely shape is a
per-venue rate the admin sets by hand, not a class table.
