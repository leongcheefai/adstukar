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

**House card**:
A free card played when no paid listing is eligible. It is the distributor's own
promotion, or the CapyAds card. It moves no points.

**Veto**:
A distributor's refusal of a listing on their own devices.
_Avoid_: Block, ban

**Excluded term**:
A phrase that stops any listing whose name or tagline contains it.

## What is counted

**Play**:
One listing shown in one placement for its full dwell. The play is the event
that moves points.
_Avoid_: Impression, view, showing

**Scan**:
A viewer who scans the code on a played listing. A scan pays a bonus.
_Avoid_: Click, tap, conversion

**Daily play cap**:
The largest number of plays one device may be paid for in one day.

**Daily budget**:
The largest number of points one campaign may spend in one day.

## Money

**Point**:
The single internal unit. A point is bought, earned, or granted. Members see the
brand name CapyPoints; the code says point.
_Avoid_: Credit, coin, token

**Lot**:
The origin of a point: `bought`, `earned`, or `granted`. The lot decides whether
the point may be withdrawn, refunded, or expired.

**Top-up**:
An advertiser's purchase of points with money.
_Avoid_: Deposit, recharge, refill

**Payout**:
A distributor's conversion of earned points back into money.
_Avoid_: Withdrawal, cash-out

**Fee**:
The points CapyAds keeps from each play and each scan.
_Avoid_: Commission, margin, spread

**Refund**:
Money returned for bought points that a member did not spend.

**Ledger entry**:
One immutable point movement. It carries an amount, a reason, a state, and a lot.

**Balance**:
The sum of a member's settled ledger entries.

**Settlement**:
The delay after which an earn entry counts towards the balance.

**Hold**:
The longer delay after settlement before earned points may leave as a payout.

**Expiry**:
The moment granted or earned points lose their value. Bought points never expire.

**Grant**:
Points the system gives. A new advertiser gets a trial grant at the first
approved listing.
