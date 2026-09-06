# Settings page model — keep Console

Decided 2026-09-04 from a four-way prototype at `/dashboard/proto/settings` (deleted).

## Direction

Keep the current model in `apps/app/src/routes/dashboard/settings.tsx`. No change.

- **Navigation:** persistent left rail, 288px, one section visible at a time.
- **Section state:** carried in the `?tab=` search param, so a section is linkable.
- **Field layout:** labels stacked above full-width controls, one column.
- **Save model:** immediate, one button per sub-form. Nothing is deferred and
  there is no dirty state to track.
- **Admin sections:** appended to the same rail under an "Admin" group heading.

It wins because the section count is still growing (seven today, moderation and
releases arrived last) and every section is a small independent form. A rail
absorbs new sections at no cost to the ones already there.

## Rejected

**Ledger — one scrolling page, label-left rows,each row saves itself.**
Rejected on scale. It reads well at seven sections and collapses past about ten
rows, because a flat page gives every setting the same weight. The sessions list
also fights the row model: it is a list, not a setting, so it breaks the rhythm
the whole variant depends on.

**Focused — top tab strip, editorial spacing, deferred save bar.**
Rejected on cost per change. The sticky bar means every section needs dirty
tracking and a discard path, and the generous spacing pushed the sessions list
below the fold at 1440px. Its display-face section titles were the one part
worth remembering; revisit if Settings ever needs to feel less like a control
panel.

**Command — search as the only navigation.**
Rejected as premature. It answers "I know the word but not the section", which
is a problem a seven-section rail does not have yet. Reconsider past roughly
twenty settings. It also needs a hand-maintained keyword index, which drifts the
moment someone adds a setting and forgets it.

## Follow-ups this run surfaced, not applied

- `settings.tsx` switches the selected rail item to `font-medium`, which reflows
  that row. Signal selection with colour only.
- `packages/ui/src/primitives/switch.tsx` uses `transition-all`.
