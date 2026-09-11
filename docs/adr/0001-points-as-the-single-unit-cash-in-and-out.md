# Points are the single internal unit, and cash crosses the boundary both ways

CapyAds started as a barter exchange: no money moved, and a member paid for ads
by showing ads (+1 earned, -2 spent). We changed it into a two-sided network. An
advertiser buys points with money, a distributor earns points, and a distributor
converts earned points back into money. Points stay the only unit inside the
system, at a fixed peg of 1000 points to 1 US dollar, so `ledger_entry.delta`
stays an integer and money touches only the two boundaries.

## Consequences

- Every point carries a **lot**: `bought`, `earned`, or `granted`. The lot is not
  a label. It decides the legal weight of the point.
  - `bought` — money we owe back. Refundable, never withdrawable, never expires.
  - `earned` — money we owe out. Withdrawable after the hold, expires.
  - `granted` — free. Neither refundable nor withdrawable, expires.
- The fee is an explicit `fee` ledger entry, not a hidden spread. A distributor
  who compares their earnings with an advertiser's spend must find the same
  number we published.
- A spend consumes granted points first, then bought points, oldest first.
- Any free-point mechanic (welcome grant, referral reward, barter credit) is a
  cash faucet if it is withdrawable. Grants must stay non-withdrawable.
