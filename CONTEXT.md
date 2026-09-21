# CapyAds — domain glossary

CapyAds is an ad network for small screens. An advertiser pays to have listings
played on screens that other members own, and those members earn from the plays.
Use these terms as written. The code, the dashboard, and the docs share them.

## People

**Member**:
A signed-up user. A member may advertise, distribute, or do both.
_Avoid_: Account, customer, publisher

**Advertiser**:
A member in the paying role.
_Avoid_: Business, brand, buyer

**Distributor**:
A member in the earning role. A distributor owns devices.
_Avoid_: Host, partner, affiliate

**Admin**:
A member who reviews listings and devices, and who pays out.

## What is advertised

**Campaign**:
One destination site and every listing that points at it. Holds the name, the
URL, the verified domain, the state, and the daily budget.
_Avoid_: Product, project, group

**Listing**:
One creative under a campaign. A campaign holds up to four, so an advertiser can
compare them.
_Avoid_: Ad, creative, variant, banner

**Slot**:
One position on the ticker ring, booked by one advertiser for one term at one
flat price. The ring holds a fixed count of slots. The numbers live in
`economy.slot`. The charge lands at booking and the term starts when the
campaign is verified and its creative approved. While the term runs, every
venue screen plays it, and the platform pays each screen its rate
(docs/adr/0010). A term ends and does not renew. A slot that never ran gives its charge back through a `void` row, because no
money leaves Stripe; a top-up refund is a different act (see Refund).
_Avoid_: spot. "Position" is the number on the ring, not the booking.

**Ring**:
The fixed count of positions the CapyTV ticker prints, `GET /slots/loop` on
the wire. Every screen prints the same ring. Not the Loop: that is the batch
of plays a venue screen caches.
_Avoid_: loop (for the ring), carousel

**Band**:
One position of the ring as a screen prints it. A band is `open` (nobody holds
it), `held` (paid for, and waiting for the domain check or the review), or
`brand` (a running slot with an approved creative).

**Verified domain**:
A campaign's domain, proved by a token the advertiser publishes on that domain.
Required before a campaign may run.

**Moderation queue**:
Listings and devices that wait for an admin decision.

## Where ads appear

**CapyTV**:
The screen app a distributor installs. It shows content, and it plays listings
over that content.

**Device**:
One physical screen that runs CapyTV. Holds the venue type, the tier, the
location, the state, and the daily play cap.
_Avoid_: Screen, TV, player, kiosk

**Placement**:
One overlay region on a device: `band`, `float` or `ticker`. Holds the format,
the dwell, and the gap.
_Avoid_: Slot, zone, spot, unit

**Dwell**:
How long one listing stays on a placement.

**Gap**:
The quiet time between two plays on a device.

**Tier**:
The class an admin stamps on a device at approval. It multiplies the rate the
device earns: standard 1×, premium 1.5×, flagship 2×. A new device starts at
standard and moves up after a clean payout review. The admin reads the photo
and the venue: standard is a steady but small crowd (under 5 viewers per
play); premium is a queue or a seated crowd for most of the open hours (5 to
15); flagship is a large screen in a high-traffic public space, or a venue the
platform wants for its name (above 15). See docs/adr/0010.

**Loop**:
The batch of plays CapyTV takes at once and holds on the device. The screen plays
the loop one at a time and reports each play, so a screen that loses its network
keeps running and reports when the network returns.
_Avoid_: Playlist, queue, rotation

**House card**:
A free card played when no paid listing is eligible. It is the distributor's own
promotion, or the CapyAds card. It moves no money.

**Veto**:
A distributor's refusal of a listing on their own devices.
_Avoid_: Block, ban

**Excluded term**:
A phrase that stops any listing whose name or tagline contains it.

## What is counted

**Play**:
One listing shown in one placement for its full dwell. The play is the event
that moves money: the platform pays the screen a fixed rate for it
(docs/adr/0010).
_Avoid_: Impression, view, showing

**Scan**:
A viewer who scans the code on a played listing. It is counted and not paid;
the scan-to-play ratio is a fraud signal.
_Avoid_: Click, tap, conversion

**Open hours**:
The hours a distributor states their venue is open, in whole hours and in the
venue's own time. The payout review counts the plays that fall outside them.

**Daily play cap**:
The largest number of plays one device may be paid for in one day.

## Money

**Wallet**:
A member's balance in US dollars. Money enters as a top-up or as an earn, and
leaves as a payout.
_Avoid_: Points, credits, coins, tokens

**Amount**:
The stored unit: one thousandth of a US dollar. The ledger holds integers in
this unit, so a play rate below one cent is still a whole number. A member
never sees the unit; every page shows dollars.
_Avoid_: Point, mil

**Lot**:
The origin of money in the wallet: `bought`, `earned`, or `granted`. The lot
decides whether the money may be withdrawn, refunded, or expired.

**Top-up**:
An advertiser's payment into the wallet. It opens as a checkout and only
becomes balance when the payment lands.
_Avoid_: Deposit, recharge, refill

**Top-up bounds**:
The least and the most one top-up may be, in US dollars, plus the presets the
panel offers. Every amount is at the same rate and none carries a bonus.

**Payout**:
A distributor's request to turn earned money into a payment. A member asks, an
admin reviews the history and approves, and Stripe sends the money to the
member's connected account (docs/adr/0005, docs/adr/0008).
_Avoid_: Withdrawal, cash-out

**Stripe account**:
The connected Stripe account a distributor is paid to. It goes on file the day
a member cashes out, not at signup. Stripe holds the identity and the bank
details; we hold the id, the country, and whether Stripe has cleared it.
_Avoid_: Payout account, payout details

**Withdrawable**:
The earned money that has served the hold, less what already left. It is what
one payout may take, and it is never the same number as the balance.

**Rate**:
What a screen earns for one play, by tier. It lives in `economy.earn` and no
fee comes off it.
_Avoid_: Fee, commission, margin, spread, CPM

**Refund**:
Money returned for a top-up that a member did not spend. It runs for a window
after the payment, pays what was paid less what the card processor kept, and
posts a `refund` entry against the `bought` lot. Only an admin gives one: the
member asks, and the act lives under Settings → Top-ups (docs/adr/0006).

**Refundable**:
The unspent part of one top-up. A spend takes the oldest bought money, so the
bought balance says how much is left, never the rows.

**Ledger entry**:
One immutable movement. It carries an amount, a reason, a state, and a lot.

**Balance**:
The sum of a member's settled ledger entries, shown in dollars.

**Settlement**:
The delay after which an earn entry counts towards the balance.

**Hold**:
The longer delay after settlement before earned money may leave as a payout. It
is the window in which a dead screen is caught before cash leaves.

**Expiry**:
The moment granted or earned money loses its value. Bought money never expires.

**Trial credit**:
Money the system grants. A new advertiser gets it at the first approved
listing. It is the `granted` lot on screen.
_Avoid_: Grant, welcome points, bonus
