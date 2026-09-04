# Listing create flow — Wizard

Decided 2026-09-04 from a three-way prototype at `/_dev/proto-listing` (deleted).

## Direction

A guided dialog with three steps, in the order the domain requires: campaign,
then the product link, then the ads. It replaces the two-step dialog in
`apps/app/src/components/products/product-form-dialog.tsx`.

- **Entry:** the `+` button on the Listing page opens a menu with three options —
  "New campaign", "Ad for an existing campaign", "Duplicate your best ad". The
  second and third open the dialog at step 3 with the campaign already chosen.
- **Step rail:** `1 Campaign · 2 Product link · 3 Ads`, shown only when the flow
  creates a campaign. A completed step carries a check.
- **Step 1 — Campaign:** pick a new site or one of the domains already listed.
  There is no free-text campaign name; see "Known gap" below.
- **Step 2 — Product link:** the pill URL field, `h-14 rounded-full`, mono, with
  the submit button inside it. Enter submits. A pass fills the name, tagline and
  logo from the page, holds the check badge for 900ms, then advances.
  A failure keeps the step and offers "Continue without reading".
- **Step 3 — Ads:** name, tagline with a live counter, logo, and both AdCard
  sizes as a live preview. "Add another tagline" queues the draft and returns the
  caret to the tagline field. The primary button counts what it will create.
- **Dialog width:** per step — `sm:max-w-lg`, `sm:max-w-lg`, `sm:max-w-4xl`,
  transitioned on `max-width` for 200ms `ease-out`.
- **Panel motion:** `animate-in fade-in-0 slide-in-from-right-2 duration-200`,
  with `motion-reduce:animate-none`.
- **Height:** `max-h-[calc(100dvh-2rem)] overflow-y-auto`. Worst content (a long
  campaign name plus a queue of taglines) is taller than a phone.

It wins because listing an ad is a rare action, not a daily one. A member does it
once for each product and does not learn the model from repetition. The steps
carry the model — campaign, then link, then ads — instead of assuming it.

## Known gap

The wizard as prototyped opened with a free-text campaign name. The schema has no
place for it: `product` in `packages/db/src/schema/exchange.ts` has no campaign
column, and `groupIntoCampaigns` groups by `domain`. Step 1 therefore asks the
member to choose a new site or an existing one. A real campaign name needs a
column and a migration, which this UI-only branch does not touch.

## Rejected

**Composer — one right-side sheet, every field visible, no steps.**
Rejected on the first impression. It is the fastest way to write three taglines
in one pass, and that is the wrong thing to optimise: most members write one ad,
once. The panel opens as a wall of fields and gives no order to follow. It also
forces one product name across every ad in the campaign, which the current
model does not require.

**Inline — the draft campaign edited in place in the listing grid, no overlay.**
Rejected on the cost of the edge cases, not on the idea. Editing in the grid is
excellent when the member already knows the model, and the draft cell looks
exactly like the saved cell. But the page then holds two modes at once, so
Escape, discard confirmation and the unsaved state all need care, and the header
must wrap below `md` to fit five controls. Revisit it as a fast path for a second
tagline once the create flow itself is settled.
