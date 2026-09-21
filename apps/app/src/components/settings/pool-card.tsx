import { usd } from "@repo/config/money";
import { Card, CardContent, cn } from "@repo/ui";
import { usePool } from "../../lib/admin";

const DAY = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/**
 * Slot revenue this week beside the earn the plays posted this week. Revenue
 * is capped at the ring and the earn grows with every screen, so this is the
 * one number that says when to move a lever (docs/adr/0010).
 */
export function PoolCard() {
  const { data: pool } = usePool();
  if (!pool) return null;
  const over = pool.earnPosted > pool.slotRevenue;
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Pool · week of {DAY.format(new Date(pool.weekStart))}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Slot revenue</dt>
            <dd className="mt-1 font-mono text-lg tabular-nums">{usd(pool.slotRevenue)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Earn posted</dt>
            <dd className={cn("mt-1 font-mono text-lg tabular-nums", over && "text-destructive")}>
              {usd(pool.earnPosted)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          When the earn passes the revenue, move a lever: the slot price, the pace of approval, or
          the pace of tier promotion.
        </p>
      </CardContent>
    </Card>
  );
}
