# The wallet speaks money, and the unit keeps its size

Members used to read a brand name, CapyPoints, for the unit inside the ledger,
at a fixed peg of 1000 to one US dollar (docs/adr/0001). We removed the name.
A member now sees a balance in US dollars, pays per play in dollars, and earns
dollars. No brand word replaces it: the product sells advertising, not a
currency.

## What stays the same

- The ledger keeps one integer unit, one thousandth of a US dollar. Every rate,
  cap, hold, and expiry keeps its value. No stored number changed.
- The lots (`bought`, `earned`, `granted`) and their rules stay. A free grant is
  still not withdrawable; it reads "trial credit" on screen.
- Money still crosses the boundary twice, as a top-up and as a payout.

## Why the unit did not move to cents

A play on a standard screen costs 4 units, which is $0.004. A ledger in whole
cents cannot hold that, and raising every rate to a whole cent would change the
price of the product to fit the database. The unit stays; only its name went.

## How a fraction of a cent reads

- A play rate shows per 1,000 plays: `$4.00 per 1,000 plays`. The rate in units
  is the dollar figure per thousand, so the display needs no arithmetic.
- A balance or a row shows two decimals when it is whole cents, and three when
  it is not: `$12.34`, `$12.345`, `-$0.004`. It never rounds. A row that read
  `-$0.00` would be a lie.
- One formatter, `@repo/config/money`, does this for every app.

## Consequences

- The code says `amount` for a stored value, `cents` for what Stripe moves, and
  `usd` for a string a member reads. The word `point` survives only in
  `apps/embed`, which is unmaintained.
- `economy.unit.perUsd` is the one place that states the size of the unit.
- A daily budget is entered in dollars and stored as an amount, so it is always
  a whole number of cents.
