# The distributor earns a fixed rate, and the platform pays it from slot revenue

> Amended by docs/adr/0013: the tiers are gone. Every screen earns the standard
> rate, and the third lever below no longer exists.

An advertiser pays for one thing: a slot on the ring, at a flat price for a
term (`economy.slot`, docs/adr/0009). Every venue screen plays the ring. A
screen earns a fixed rate per play at its tier (`economy.earn`), and CapyAds
pays that rate out of the slot money. The per-play advertiser economy on venue
screens (docs/adr/0002) is retired.

## The numbers

| Tier | Multiplier | Per 1,000 plays | Per play |
|---|---|---|---|
| Standard | 1 | $2.00 | 2 units |
| Premium | 1.5 | $3.00 | 3 units |
| Flagship | 2 | $4.00 | 4 units |

There is no fee row. The number a distributor reads is the number they keep.

## Why

- A cafe owner reads one number. A tier-by-format table, a fee, and a scan
  bonus were four numbers for one screen.
- A flat slot price is what an advertiser buys (docs/adr/0009). A per-play bill
  next to it would charge the same campaign twice.
- Billing a scan made sense when the advertiser paid per play. It does not when
  the advertiser pays a flat price. A scan is still recorded, and the
  scan-to-play ratio is still the fraud signal the payout review reads.

## The pool

Revenue is capped at the ring: 20 slots × $20 / 7 days is $57 a day when
the ring is full. The earn grows with every screen approved. A full ring pays
about 89 standard screens a day at 225 plays each; a half ring pays about 44.
The platform's take is what is left, and it can go negative.

Nothing in code stops a play from paying when the pool is spent. That would
pay the early screens of the day and not the late ones. Three levers keep the
pool positive, and an admin moves them by hand:

1. The slot price. Raise it when the ring stays full.
2. The pace of device approval. A screen costs the pool from the day it is
   approved.
3. The pace of tier promotion. A new device starts at standard and moves up
   after a clean payout review.

`GET /admin/pool` shows the week's slot revenue beside the week's earn.

## What the tiers mean

| Tier | What the admin looks for | Viewers per play |
|---|---|---|
| Standard | A steady but small crowd. The default. | under 5 |
| Premium | A queue or a seated crowd for most of the open hours. | 5 to 15 |
| Flagship | A large screen in a high-traffic public space, or a venue the platform wants for its name. | above 15 |

## What the rules are

- A play pays at report time, when the slot is `running`, the creative is
  `approved`, the campaign is `active` and verified, and the device is under
  its daily cap. Otherwise the play shows, counts, and pays nothing.
- The earn is one `earn` row, lot `earned`, pending until settlement, keyed
  on the play. No `spend` row and no `fee` row.
- A scan records, redirects, and posts nothing.
- The daily budget, the pause reasons, the pacing job, and the first-listing
  grant are gone. A campaign pauses by hand only.

## What stays

The payout path is unchanged: settlement, the hold, the review, Stripe
Connect (docs/adr/0005, docs/adr/0008). The daily play cap is unchanged.
`apps/embed` keeps its own dead numbers.

Revisit when the pool card shows the earn above the revenue for two weeks in a
row. The likely next step is a slot price that follows the screen count.
