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
One band of the ticker loop, booked by one advertiser for one term at one flat
price. The loop holds a fixed count of slots. The numbers live in `economy.slot`.
The API does not model a slot yet; the dashboard reads one campaign with one
listing as one slot.
_Avoid_: spot, position

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
The quality class an admin stamps on a device at approval. The tier sets the
rate the device earns and the advertiser pays.

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
that moves money.
_Avoid_: Impression, view, showing

**Scan**:
A viewer who scans the code on a played listing. A scan pays a bonus.
_Avoid_: Click, tap, conversion

**Open hours**:
The hours a distributor states their venue is open, in whole hours and in the
venue's own time. The payout review counts the plays that fall outside them.

**Daily play cap**:
The largest number of plays one device may be paid for in one day.

**Daily budget**:
The most money one campaign may spend in one day. The listings
under the campaign split it evenly, so one creative cannot take the whole day.

**Pause reason**:
Why the system stopped a campaign: `budget` when the daily budget is spent, or
`balance` when the owner's balance ran out. A campaign a person paused carries no
reason. A budget pause lifts on the next day; a balance pause lifts when the
balance comes back.
_Avoid_: Auto-pause, throttle

## Money

**Wallet**:
A member's balance in US dollars. Money enters as a top-up, moves with each
play, and leaves as a payout.
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

**Fee**:
The share CapyAds keeps from each play and each scan.
_Avoid_: Commission, margin, spread

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
