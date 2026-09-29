# An admin may give a slot for nothing, up to five live at once

An admin may give a member a slot at no charge: a comped slot. It is the
member's own booking, on their own account, and it runs exactly as a paid one
does. Only the charge is missing. `POST /admin/slots/comped` opens it, and
`GET /admin/slots/comped` lists the live ones.

## Why

- The platform wants to put a friend's or a partner's brand on the ring
  without asking them to pay, and without faking a top-up to do it.
- A `granted` credit would have done it with no new code, and it was refused.
  Nothing grants money any more (docs/adr/0010); the pool card would count the
  gift as slot revenue that never arrived; and a refused booking would put
  spendable credit back in the member's wallet.
- A slot with no charge says what happened. `amount` is 0, no ledger row
  points at it, and `GET /admin/pool` shows it as it is: no revenue, and the
  earn its plays post.

## What the rules are

- The slot goes to a member who already has an account, named by the email
  they signed up with. The member sees it on their slot page, marked
  Complimentary, and edits or archives it as their own.
- `slot.comped` is true, `slot.amount` is 0, and `slot.comped_by` names the
  admin. No `spend` row is posted.
- The gates stay. The domain check and the listing review start the term, as
  on a paid slot (docs/adr/0009). The term is `economy.slot.termDays`; it does
  not renew and does not pause.
- The ring, the report, and the pay to the screens do not read `comped`. A
  play on a comped slot pays the screen the one rate (docs/adr/0013), and the
  platform pays it with no revenue behind it.
- At most `economy.slot.compMax` comped slots (5 of the 20) are live at once.
  A comp that ends or closes gives its place back. The count is read under a
  lock, so two admins cannot both take the last place.
- A rejection or an archive before the term starts closes the slot as
  `refunded`, and there is nothing to give back.

## The cost

A comped slot takes a position a paying advertiser could have bought. While
paid slots run beside it, the screens' daily cap already binds, so it mostly
takes airtime from them rather than adding to the earn. When it runs alone, it
is the whole earn: every screen is paid for playing it, from the platform's
own pocket. The pool card shows both.

Revisit when an admin wants a comp for a length other than one term, or for
more than five brands at once.
