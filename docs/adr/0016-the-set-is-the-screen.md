# The set is the screen, and one crossing is one play

> Status: accepted, 2026-10-01. Amends docs/adr/0003, docs/adr/0009 and
> docs/adr/0010.

The CapyChannel set at the dashboard's root replaces `apps/capytv` as the venue
screen. A member opens the set on a screen in a venue, registers it as a device
with a photo of the screen in place, and an admin approves it. Then every brand
that crosses the crawl is one play, and the screen earns the one rate for it.

## Why

- No screen could earn. The set showed the ring and opened no play, and the
  dashboard had no page to register a device for CapyTV.
- A member already runs the set. One app on the screen is less to install,
  explain and support than two.
- ADR 0009 kept the set unpaid because a per-play earn on a screen every member
  can open is a cash faucet. Approval answers that: an admin approves each set
  from a photo of the screen in place, and the daily cap and the paid hours bound
  the money of each approved device.

## What the rules are

- `GET /ring?key=` gives an approved device the ring in position order, with one
  open play per brand per lap on the device's `ticker` placement. `/report` and
  `playPays()` do not change.
- Several paid brands are on screen at once. The rule "one paid listing at a
  time" is retired. The cap bounds the money, not the count of brands on screen.
- A screen is never paid for its owner's own brand. The set shows the brand, and
  `/ring` opens no play for it, as `/loop` never served it.
- The rate is 1 unit per play ($1.00 per 1,000), the smallest the integer ledger
  can pay. The cap is 1,000 plays a day, so a screen earns at most $1.00 a day.
  A full ring (about 300 crossings an hour) reaches the cap in about 3.3 hours.
  Raise the slot price or slow approvals as in ADR 0010 when the ring fills.
- The device key is the set's credential. A registered set plays and earns with
  no session. Approval keeps the key the set registered with.
- A crossing counts only when the page stays visible for the whole crossing, and
  only when it takes most of the time a crossing takes, so a jump in the crawl
  is not a play.

## What we lose

The bands carry no scan code, so every set has a scan-to-play ratio of zero. The
payout review keeps two signals: plays outside the stated open hours, and devices
that share an address or a network.
