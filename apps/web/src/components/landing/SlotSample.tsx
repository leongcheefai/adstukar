import { DAY_MS, economy, slotTermEnd } from "@repo/config/economy";
import { Badge } from "@repo/ui";
import type { LandingSample } from "../../lib/landing/sample";

/**
 * One slot as the advertiser's dashboard lists it (`slot-row.tsx`): the
 * mark, the name and the tagline, its state, how much of the term is left,
 * and the two figures a flat price buys. The classes are the dashboard's
 * own, so the card is the thing itself and not a picture of it.
 */

/** The brand the card shows. A real shop, used with its own line and its own icon. */
const BRAND = {
  name: "TinyOrder",
  tagline: "Sell your food online",
  logo: "/logos/tinyorder.png",
} as const;

/** Days of the term already run when the page is built. */
const DAYS_RUN = 2;

const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

export function SlotSample({ sample }: { sample: LandingSample }) {
  const startsAt = new Date(Date.now() - DAYS_RUN * DAY_MS);
  const endsAt = slotTermEnd(startsAt);
  const daysLeft = economy.slot.termDays - DAYS_RUN;
  const elapsed = DAYS_RUN / economy.slot.termDays;
  const rate = sample.plays > 0 ? (sample.scans / sample.plays) * 100 : 0;

  return (
    <div className="sample-card rounded-xl bg-card shadow-elev-2">
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={BRAND.logo}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-md border object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{BRAND.name}</p>
            <p className="truncate text-sm text-muted-foreground">{BRAND.tagline}</p>
          </div>
        </div>
        <Badge variant="success" dot>
          Running
        </Badge>
      </div>

      <div className="mt-5 space-y-1.5 px-6 text-xs text-muted-foreground tabular-nums">
        <div className="flex justify-between gap-2">
          <span className="font-medium text-foreground">{daysLeft} days left</span>
          <span>
            {DAY.format(startsAt)} – {DAY.format(endsAt)}
          </span>
        </div>
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${elapsed * 100}%` }} />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border px-6 py-5">
        <div>
          <dt className="text-xs text-muted-foreground">Impressions</dt>
          <dd className="sample-figure mt-1 text-2xl font-medium leading-none tracking-tight">
            {sample.plays.toLocaleString("en-US")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Click-through rate</dt>
          <dd className="sample-figure mt-1 text-2xl font-medium leading-none tracking-tight">
            {rate.toFixed(1)}%
          </dd>
        </div>
      </dl>
    </div>
  );
}
