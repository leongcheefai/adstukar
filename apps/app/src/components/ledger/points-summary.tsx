import { project } from "@repo/config/project";
import { Button, Card } from "@repo/ui";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { usePayouts } from "../../lib/payouts";
import { useStats } from "../../lib/stats";
import { useTopups } from "../../lib/topups";
import { CashOutDialog } from "../payouts/cash-out-dialog";
import { BuyPointsDialog } from "../topups/buy-points-dialog";

/**
 * The two things a member wants from this page before the list itself: what
 * they hold, and how to take it out.
 *
 * There is no referral cell. Referral is deferred past the MVP (GitHub #9), and
 * a link the API does not honour is a promise the page cannot keep.
 */
export function PointsSummary() {
  const { data: stats } = useStats();
  const { data: payouts } = usePayouts();
  const { data: topups } = useTopups();
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const wantsBuy = params.get("buy") === "1";

  // The Stripe onboarding tip lands here with ?buy=1, so the buy panel opens
  // by itself once the packs are known. The flag leaves the URL at once: a
  // reload, or a saved link, must not reopen a payment panel.
  useEffect(() => {
    if (!wantsBuy || !topups) return;
    setBuyOpen(true);
    setParams(
      (prev) => {
        prev.delete("buy");
        return prev;
      },
      { replace: true },
    );
  }, [wantsBuy, topups, setParams]);

  const settled = stats?.balance.settled ?? 0;
  const withdrawable = payouts?.withdrawable ?? 0;

  return (
    <>
      {/* One panel, two cells. Divide-x only from sm: stacked on a phone the
          rules would cut across the flow rather than along it. */}
      <Card className="grid gap-0 divide-y py-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex flex-col justify-between gap-3 p-5">
          <p data-slot="label" className="text-muted-foreground">
            Total CapyPoints
          </p>
          <p className="text-3xl font-normal tracking-tight tabular-nums">
            {settled.toLocaleString()}
          </p>
          {/* The way to grow the number sits under the number it grows. */}
          <Button size="sm" onClick={() => setBuyOpen(true)} disabled={!topups}>
            Buy {project.pointsName}
          </Button>
        </div>

        <div className="flex flex-col justify-between gap-3 p-5">
          <p data-slot="label" className="text-muted-foreground">
            Cash out
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCashOutOpen(true)}
            disabled={!payouts}
          >
            Cash out CapyPoints
          </Button>
          {/* The number beside the button is the withdrawable balance, not the
              settled one: only earned points that served the hold ever leave. */}
          <p className="text-xs text-muted-foreground tabular-nums">
            {withdrawable.toLocaleString()} ready to cash out.
          </p>
        </div>
      </Card>

      {payouts && (
        <CashOutDialog overview={payouts} open={cashOutOpen} onOpenChange={setCashOutOpen} />
      )}

      {topups && <BuyPointsDialog overview={topups} open={buyOpen} onOpenChange={setBuyOpen} />}
    </>
  );
}
